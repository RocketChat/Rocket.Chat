import type { FindCursor, InsertOneResult, DeleteResult, UpdateResult } from 'mongodb';
import type {
	IMedsensePatientContext,
	MedsensePatientContextType,
	MedsensePatientContextSource,
	MedsensePatientContextStatus,
	MedsensePatientContextVocab,
} from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsensePatientContextCandidate {
	candidateId: string;
	type: MedsensePatientContextType;
	entityText: string;
	umlsCandidates: Array<{ cui: string; vocab: MedsensePatientContextVocab; code?: string; name?: string }>;
}

export interface IMedsensePatientContextMatchBatchResult {
	candidateId: string;
	matches: IMedsensePatientContext[];
}

export interface IMedsensePatientContextUpsertInput {
	patientUserId: string;
	type: MedsensePatientContextType;
	entityName: string;
	cui: string;
	vocab: MedsensePatientContextVocab;
	code?: string;
	status: MedsensePatientContextStatus;
	note: { text: string; addedAt: Date; roomId: string; source: MedsensePatientContextSource };
	addedAt?: Date;
}

export interface IMedsensePatientContextModel extends IBaseModel<IMedsensePatientContext> {
	insertEntry(entry: Omit<IMedsensePatientContext, '_id' | '_updatedAt'>): Promise<InsertOneResult<IMedsensePatientContext>>;
	upsertEntityWithNote(input: IMedsensePatientContextUpsertInput): Promise<UpdateResult<IMedsensePatientContext>>;
	matchBatchByCandidates(patientUserId: string, candidates: IMedsensePatientContextCandidate[], limitPerCandidate?: number): Promise<IMedsensePatientContextMatchBatchResult[]>;
	findRecentByPatient(patientUserId: string, limit?: number): FindCursor<IMedsensePatientContext>;
	searchByPatient(patientUserId: string, keywords: string, limit?: number): Promise<IMedsensePatientContext[]>;
	trimPatientContext(patientUserId: string): Promise<DeleteResult>;
}
