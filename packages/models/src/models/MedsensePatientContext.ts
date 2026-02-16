import type { IMedsensePatientContext } from "@rocket.chat/core-typings";
import type {
	IMedsensePatientContextModel,
	IMedsensePatientContextCandidate,
	IMedsensePatientContextMatchBatchResult,
	IMedsensePatientContextUpsertInput,
} from "@rocket.chat/model-typings";
import type { Db, IndexDescription, InsertOneResult, DeleteResult, Filter, UpdateResult } from "mongodb";

import { BaseRaw } from "./BaseRaw";

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class MedsensePatientContextRaw extends BaseRaw<IMedsensePatientContext> implements IMedsensePatientContextModel {
	constructor(db: Db) {
		super(db, "medsense_patient_context");
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { patientUserId: 1, type: 1, cui: 1 }, unique: true, sparse: true },
			{ key: { patientUserId: 1, _updatedAt: -1 } },
			{ key: { entityName: "text", "notes.text": "text", type: "text" } },
		];
	}

	async insertEntry(entry: Omit<IMedsensePatientContext, "_id" | "_updatedAt">): Promise<InsertOneResult<IMedsensePatientContext>> {
		return this.insertOne({
			...entry,
			_updatedAt: new Date(),
		});
	}

	async upsertEntityWithNote(input: IMedsensePatientContextUpsertInput): Promise<UpdateResult<IMedsensePatientContext>> {
		const note = {
			text: input.note.text,
			addedAt: input.note.addedAt,
			roomId: input.note.roomId,
			source: input.note.source,
		};

		const filter: Filter<IMedsensePatientContext> = {
			patientUserId: input.patientUserId,
			type: input.type,
			cui: input.cui,
		};

		const existing = await this.findOne(filter, {
			projection: {
				notes: 1,
			},
		});

		const hasDuplicateNote = Boolean(
			existing?.notes?.some(
				(item) => item?.text === note.text && item?.roomId === note.roomId && item?.source === note.source,
			),
		);

		const updateDoc: any = {
			$set: {
				entityName: input.entityName,
				vocab: input.vocab,
				code: input.code,
				status: input.status,
				summary: note.text,
				roomId: note.roomId,
				source: note.source,
				_updatedAt: new Date(),
			},
			$setOnInsert: {
				patientUserId: input.patientUserId,
				type: input.type,
				cui: input.cui,
				addedAt: input.addedAt || new Date(),
			},
		};

		if (!hasDuplicateNote) {
			updateDoc.$push = { notes: note };
		}

		return this.updateOne(filter, updateDoc, { upsert: true });
	}

	async matchBatchByCandidates(
		patientUserId: string,
		candidates: IMedsensePatientContextCandidate[],
		limitPerCandidate = 3,
	): Promise<IMedsensePatientContextMatchBatchResult[]> {
		const safeLimit = Math.max(1, Math.min(limitPerCandidate, 5));
		const results: IMedsensePatientContextMatchBatchResult[] = [];

		for (const candidate of candidates || []) {
			if (!candidate || !candidate.candidateId || !candidate.type) {
				continue;
			}

			const candidateCUIs = (candidate.umlsCandidates || []).map((c) => c.cui).filter(Boolean);
			const orFilters: Filter<IMedsensePatientContext>[] = [];
			if (candidateCUIs.length) {
				orFilters.push({ cui: { $in: candidateCUIs } } as Filter<IMedsensePatientContext>);
			}

			const entityText = String(candidate.entityText || "").trim();
			if (entityText) {
				orFilters.push({ entityName: { $regex: escapeRegex(entityText), $options: "i" } } as Filter<IMedsensePatientContext>);
			}

			const filter: Filter<IMedsensePatientContext> = {
				patientUserId,
				type: candidate.type,
				...(orFilters.length ? { $or: orFilters } : {}),
			};

			const matches = await this.find(filter, {
				sort: { _updatedAt: -1 },
				limit: safeLimit,
			}).toArray();

			results.push({
				candidateId: candidate.candidateId,
				matches,
			});
		}

		return results;
	}

	findRecentByPatient(patientUserId: string, limit = 3): ReturnType<IMedsensePatientContextModel["findRecentByPatient"]> {
		return this.find(
			{ patientUserId },
			{ sort: { _updatedAt: -1 }, limit },
		);
	}

	async searchByPatient(patientUserId: string, keywords: string, limit = 3): Promise<IMedsensePatientContext[]> {
		const trimmed = String(keywords || "").trim();
		if (!trimmed) {
			return this.findRecentByPatient(patientUserId, limit).toArray();
		}

		return this.find(
			{
				patientUserId,
				$text: { $search: trimmed },
			},
			{
				sort: { score: { $meta: "textScore" } },
				limit: Math.min(limit, 5),
				projection: { score: { $meta: "textScore" } } as any,
			},
		).toArray();
	}

	// Kept for interface compatibility. Patient context is not auto-trimmed/merged.
	async trimPatientContext(_patientUserId: string): Promise<DeleteResult> {
		return { acknowledged: true, deletedCount: 0 };
	}
}
