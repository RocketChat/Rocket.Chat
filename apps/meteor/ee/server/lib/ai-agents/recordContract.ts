import { createHash } from 'node:crypto';

import type {
	AiAgentRevisionStatus,
	AiEngineReportedSeatState,
	AiEngineSeatAvailability,
	AiSeatState,
	IAiEngineObservedReport,
	IAiEngineObservedSeat,
} from '@rocket.chat/core-typings';
import { Binary } from 'mongodb';

import {
	AiAgentValidationError,
	CHAT_ID_PATTERN,
	COMMIT_SHA_PATTERN,
	MAX_CHAT_ROOMS,
	MAX_RECORD_BYTES,
	MAX_ROUTES,
	MAX_SKILLS,
	MAX_TOOLS,
	SEAT_ID_PATTERN,
	SKILL_ID_PATTERN,
	TOOL_ID_PATTERN,
	UUID_PATTERN,
	validateAgentInstructions,
	validateAgentName,
	validateModelRouteId,
} from './textValidation';

export const SEAT_RECORD_CONTRACT_VERSION = '1.1.0' as const;

export const DEFAULT_SEAT_MEMORY = {
	retentionDays: 7,
} as const;

export const DEFAULT_SEAT_LIMITS = {
	perPersonHour: 10,
	perPersonDay: 50,
	dailySpendUsd: 1.5,
} as const;

export type AgentRecord110Model = {
	provider: string;
	id: string;
	address?: string;
};

export type AgentRecord110 = {
	contractVersion: typeof SEAT_RECORD_CONTRACT_VERSION;
	id: string;
	version: number;
	updatedAt: string;
	name: string;
	instructions: string;
	model: AgentRecord110Model;
	tools: string[];
	skills: {
		commit: string;
		ids: string[];
	};
	memory: {
		retentionDays: number;
	};
	limits: {
		perPersonHour: number;
		perPersonDay: number;
		dailySpendUsd: number;
		fallbackModel?: AgentRecord110Model;
	};
	status: AiAgentRevisionStatus;
	chat: {
		claim: string;
		rooms: string[];
	};
};

export type BuiltAgentRecord110 = {
	record: AgentRecord110;
	rawBytes: string;
	buffer: Buffer;
	binary: Binary;
	digest: string;
};

export type SeatEnvelope110 = {
	contractVersion: typeof SEAT_RECORD_CONTRACT_VERSION;
	requestId: string;
	engineId: string;
	seatId: string;
	seatState: AiSeatState;
	kind: 'head' | 'version';
	headVersion: number;
	version: number;
	digest: string | null;
	bytes?: string;
};

export function sha256Hex(raw: Buffer | string): string {
	const buf = typeof raw === 'string' ? Buffer.from(raw, 'utf8') : raw;
	return createHash('sha256').update(buf).digest('hex');
}

function buildCanonicalModel(model: AgentRecord110Model): AgentRecord110Model {
	if (model.address !== undefined) {
		return { provider: model.provider, id: model.id, address: model.address };
	}
	return { provider: model.provider, id: model.id };
}

/**
 * Builds and validates a canonical 1.1.0 seat agent record in deterministic key order,
 * producing exact UTF-8 bytes and lowercase SHA-256 hex digest matching the C01 golden vectors.
 */
export function buildAgentRecord110(input: {
	id: string;
	version: number;
	updatedAt: string;
	name: string;
	instructions: string;
	model: AgentRecord110Model;
	tools: readonly string[];
	skills: { commit: string; ids: readonly string[] };
	memory?: { retentionDays: number };
	limits?: { perPersonHour: number; perPersonDay: number; dailySpendUsd: number; fallbackModel?: AgentRecord110Model };
	status: AiAgentRevisionStatus;
	chat: { claim: string; rooms: readonly string[] };
}): BuiltAgentRecord110 {
	if (!SEAT_ID_PATTERN.test(input.id)) {
		throw new AiAgentValidationError('seat-id-invalid');
	}
	if (!Number.isSafeInteger(input.version) || input.version <= 0) {
		throw new AiAgentValidationError('version-invalid');
	}
	if (!UUID_PATTERN.test(input.chat.claim)) {
		throw new AiAgentValidationError('claim-invalid');
	}
	if (!COMMIT_SHA_PATTERN.test(input.skills.commit)) {
		throw new AiAgentValidationError('skills-commit-invalid');
	}

	const name = validateAgentName(input.name);
	const instructions = validateAgentInstructions(input.instructions);

	if (input.tools.length > MAX_TOOLS || new Set(input.tools).size !== input.tools.length) {
		throw new AiAgentValidationError('tool-list-invalid');
	}
	for (const tool of input.tools) {
		if (!TOOL_ID_PATTERN.test(tool)) {
			throw new AiAgentValidationError('tool-list-invalid');
		}
	}

	if (input.skills.ids.length > MAX_SKILLS || new Set(input.skills.ids).size !== input.skills.ids.length) {
		throw new AiAgentValidationError('skill-list-invalid');
	}
	for (const skill of input.skills.ids) {
		if (!SKILL_ID_PATTERN.test(skill)) {
			throw new AiAgentValidationError('skill-list-invalid');
		}
	}

	if (
		input.chat.rooms.length < 1 ||
		input.chat.rooms.length > MAX_CHAT_ROOMS ||
		new Set(input.chat.rooms).size !== input.chat.rooms.length
	) {
		throw new AiAgentValidationError('room-list-invalid');
	}
	for (const roomId of input.chat.rooms) {
		if (!CHAT_ID_PATTERN.test(roomId)) {
			throw new AiAgentValidationError('room-list-invalid');
		}
	}

	const memory = input.memory ?? DEFAULT_SEAT_MEMORY;
	const limitsInput: AgentRecord110['limits'] = input.limits ?? DEFAULT_SEAT_LIMITS;
	const limits: AgentRecord110['limits'] =
		limitsInput.fallbackModel !== undefined
			? {
					perPersonHour: limitsInput.perPersonHour,
					perPersonDay: limitsInput.perPersonDay,
					dailySpendUsd: limitsInput.dailySpendUsd,
					fallbackModel: buildCanonicalModel(limitsInput.fallbackModel),
				}
			: {
					perPersonHour: limitsInput.perPersonHour,
					perPersonDay: limitsInput.perPersonDay,
					dailySpendUsd: limitsInput.dailySpendUsd,
				};

	// Canonical key order matching C01 golden vectors byte-for-byte.
	const record: AgentRecord110 = {
		contractVersion: SEAT_RECORD_CONTRACT_VERSION,
		id: input.id,
		version: input.version,
		updatedAt: input.updatedAt,
		name,
		instructions,
		model: buildCanonicalModel(input.model),
		tools: [...input.tools],
		skills: {
			commit: input.skills.commit,
			ids: [...input.skills.ids],
		},
		memory: {
			retentionDays: memory.retentionDays,
		},
		limits,
		status: input.status,
		chat: {
			claim: input.chat.claim,
			rooms: [...input.chat.rooms],
		},
	};

	const rawBytes = JSON.stringify(record);
	const buffer = Buffer.from(rawBytes, 'utf8');
	if (buffer.byteLength > MAX_RECORD_BYTES) {
		throw new AiAgentValidationError('record-too-large');
	}

	return {
		record,
		rawBytes,
		buffer,
		binary: new Binary(buffer),
		digest: sha256Hex(buffer),
	};
}

interface BsonBinaryLike {
	readonly _bsontype: 'Binary';
	readonly buffer: ArrayBufferView;
	readonly position?: number;
	length?: () => number;
}

function isBsonBinaryLike(value: unknown): value is BsonBinaryLike {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const candidate = value as Partial<BsonBinaryLike>;
	return candidate._bsontype === 'Binary' && ArrayBuffer.isView(candidate.buffer);
}

export function revisionBytesToUtf8(bytes: Binary | Buffer | Uint8Array | string): string {
	if (typeof bytes === 'string') {
		return bytes;
	}
	// Dual-package BSON instances across Meteor/MongoDB driver realms fail `instanceof Binary`,
	// so duck-type `_bsontype === 'Binary'` before falling back to generic buffer views.
	if (bytes instanceof Binary || isBsonBinaryLike(bytes)) {
		const raw = bytes.buffer;
		const declaredLen = typeof bytes.length === 'function' ? bytes.length() : bytes.position;
		const len =
			typeof declaredLen === 'number' && Number.isFinite(declaredLen) ? Math.max(0, Math.min(declaredLen, raw.byteLength)) : raw.byteLength;
		return Buffer.from(raw.buffer, raw.byteOffset, len).toString('utf8');
	}
	if (ArrayBuffer.isView(bytes)) {
		return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf8');
	}
	return Buffer.from(bytes).toString('utf8');
}

export function parseStoredRecord110(bytes: Binary | Buffer | Uint8Array | string): AgentRecord110 | null {
	try {
		const raw = revisionBytesToUtf8(bytes);
		if (Buffer.byteLength(raw, 'utf8') > MAX_RECORD_BYTES) {
			return null;
		}
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return null;
		}
		const record = parsed as Partial<AgentRecord110>;
		if (record.contractVersion !== SEAT_RECORD_CONTRACT_VERSION) {
			return null;
		}
		if (typeof record.id !== 'string' || typeof record.version !== 'number' || typeof record.name !== 'string') {
			return null;
		}
		return record as AgentRecord110;
	} catch {
		return null;
	}
}

export function buildSeatEnvelope110(input: {
	requestId: string;
	engineId: string;
	seatId: string;
	seatState: AiSeatState;
	kind: 'head' | 'version';
	headVersion: number;
	version: number;
	digest: string | null;
	bytes?: string;
}): SeatEnvelope110 {
	const envelope: SeatEnvelope110 = {
		contractVersion: SEAT_RECORD_CONTRACT_VERSION,
		requestId: input.requestId,
		engineId: input.engineId,
		seatId: input.seatId,
		seatState: input.seatState,
		kind: input.kind,
		headVersion: input.headVersion,
		version: input.version,
		digest: input.digest,
		...(input.bytes !== undefined && { bytes: input.bytes }),
	};
	return envelope;
}

const VALID_REPORTED_STATES = new Set<AiEngineReportedSeatState>(['unprovisioned', 'provisioned', 'claimed', 'retired']);
const VALID_AVAILABILITIES = new Set<AiEngineSeatAvailability>(['available', 'unavailable']);
const REASON_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_REPORT_SEATS = 256;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateReportCatalogue(
	rawCatalogue: unknown,
): { ok: true; catalogue: IAiEngineObservedReport['catalogue'] } | { ok: false; error: string } {
	if (!isPlainObject(rawCatalogue)) {
		return { ok: false, error: 'catalogue-invalid' };
	}
	const { tools, skillsCommit, skills, modelRoutes } = rawCatalogue;
	if (!Array.isArray(tools) || tools.length > MAX_TOOLS || !tools.every((t) => typeof t === 'string' && TOOL_ID_PATTERN.test(t))) {
		return { ok: false, error: 'catalogue-tools-invalid' };
	}
	if (typeof skillsCommit !== 'string' || !COMMIT_SHA_PATTERN.test(skillsCommit)) {
		return { ok: false, error: 'catalogue-skills-commit-invalid' };
	}
	if (!Array.isArray(skills) || skills.length > MAX_SKILLS || !skills.every((s) => typeof s === 'string' && SKILL_ID_PATTERN.test(s))) {
		return { ok: false, error: 'catalogue-skills-invalid' };
	}
	if (!Array.isArray(modelRoutes) || modelRoutes.length > MAX_ROUTES) {
		return { ok: false, error: 'catalogue-routes-invalid' };
	}
	const validatedRoutes: string[] = [];
	for (const route of modelRoutes) {
		try {
			validatedRoutes.push(validateModelRouteId(route as string));
		} catch {
			return { ok: false, error: 'catalogue-routes-invalid' };
		}
	}
	return {
		ok: true,
		catalogue: {
			tools: [...new Set(tools)],
			skillsCommit,
			skills: [...new Set(skills)],
			modelRoutes: [...new Set(validatedRoutes)],
		},
	};
}

function validateReportSeatEntry(
	entry: unknown,
	seenSeatIds: Set<string>,
): { ok: true; seat: IAiEngineObservedSeat } | { ok: false; error: string } {
	if (!isPlainObject(entry)) {
		return { ok: false, error: 'seat-entry-invalid' };
	}
	if (typeof entry.seatId !== 'string' || !SEAT_ID_PATTERN.test(entry.seatId) || seenSeatIds.has(entry.seatId)) {
		return { ok: false, error: 'seat-id-invalid' };
	}
	seenSeatIds.add(entry.seatId);

	if (typeof entry.botId !== 'string' || !CHAT_ID_PATTERN.test(entry.botId)) {
		return { ok: false, error: 'seat-bot-invalid' };
	}
	if (typeof entry.state !== 'string' || !VALID_REPORTED_STATES.has(entry.state as AiEngineReportedSeatState)) {
		return { ok: false, error: 'seat-state-invalid' };
	}
	if (typeof entry.availability !== 'string' || !VALID_AVAILABILITIES.has(entry.availability as AiEngineSeatAvailability)) {
		return { ok: false, error: 'seat-availability-invalid' };
	}
	if (typeof entry.reason !== 'string' || !REASON_CODE_PATTERN.test(entry.reason)) {
		return { ok: false, error: 'seat-reason-invalid' };
	}
	if (
		!Array.isArray(entry.allowedRooms) ||
		entry.allowedRooms.length > MAX_CHAT_ROOMS ||
		!entry.allowedRooms.every((r) => typeof r === 'string' && CHAT_ID_PATTERN.test(r))
	) {
		return { ok: false, error: 'seat-rooms-invalid' };
	}
	if (typeof entry.acceptedVersion !== 'number' || !Number.isSafeInteger(entry.acceptedVersion) || entry.acceptedVersion < 0) {
		return { ok: false, error: 'seat-version-invalid' };
	}
	if (typeof entry.poisonFloor !== 'number' || !Number.isSafeInteger(entry.poisonFloor) || entry.poisonFloor < 0) {
		return { ok: false, error: 'seat-poison-floor-invalid' };
	}
	if (typeof entry.identity120Seen !== 'boolean' || typeof entry.admittedQuestionSeen !== 'boolean') {
		return { ok: false, error: 'seat-proof-flags-invalid' };
	}

	return {
		ok: true,
		seat: {
			seatId: entry.seatId,
			botId: entry.botId,
			state: entry.state as AiEngineReportedSeatState,
			availability: entry.availability as AiEngineSeatAvailability,
			reason: entry.reason,
			allowedRooms: [...entry.allowedRooms],
			acceptedVersion: entry.acceptedVersion,
			poisonFloor: entry.poisonFloor,
			identity120Seen: entry.identity120Seen,
			admittedQuestionSeen: entry.admittedQuestionSeen,
		},
	};
}

/**
 * Validates an incoming 1.1.0 `POST ai-agents.engine.report` body strictly against the Step 3 wire schema.
 * Rejects mismatched `engineId`, non-1.1.0 contract versions, invalid reason codes, or malformed arrays.
 */
export function validateEngineReport110(
	raw: unknown,
	authenticatedEngineId: string,
): { ok: true; report: IAiEngineObservedReport } | { ok: false; error: string } {
	if (!isPlainObject(raw)) {
		return { ok: false, error: 'report-malformed' };
	}
	if (raw.contractVersion !== SEAT_RECORD_CONTRACT_VERSION) {
		return { ok: false, error: 'contract-version-unsupported' };
	}
	if (raw.engineId !== authenticatedEngineId) {
		return { ok: false, error: 'engine-id-mismatch' };
	}
	if (typeof raw.workspaceId !== 'string' || !CHAT_ID_PATTERN.test(raw.workspaceId)) {
		return { ok: false, error: 'workspace-id-invalid' };
	}
	if (typeof raw.reportedAt !== 'string') {
		return { ok: false, error: 'reported-at-invalid' };
	}
	const reportedAt = new Date(raw.reportedAt);
	if (Number.isNaN(reportedAt.getTime())) {
		return { ok: false, error: 'reported-at-invalid' };
	}

	const catalogueResult = validateReportCatalogue(raw.catalogue);
	if (!catalogueResult.ok) {
		return catalogueResult;
	}

	if (!Array.isArray(raw.seats) || raw.seats.length > MAX_REPORT_SEATS) {
		return { ok: false, error: 'seats-invalid' };
	}

	const seats: IAiEngineObservedSeat[] = [];
	const seenSeatIds = new Set<string>();
	for (const entry of raw.seats) {
		const seatResult = validateReportSeatEntry(entry, seenSeatIds);
		if (!seatResult.ok) {
			return seatResult;
		}
		seats.push(seatResult.seat);
	}

	return {
		ok: true,
		report: {
			contractVersion: SEAT_RECORD_CONTRACT_VERSION,
			workspaceId: raw.workspaceId,
			reportedAt,
			catalogue: catalogueResult.catalogue,
			seats,
		},
	};
}
