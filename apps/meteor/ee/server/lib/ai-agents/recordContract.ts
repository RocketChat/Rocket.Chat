import { createHash } from 'node:crypto';

import type {
	AiAgentRevisionStatus,
	AiEngineReportContractVersion,
	AiEngineReportedSeatState,
	AiEngineSeatAvailability,
	AiEngineToolEffect,
	AiSeatState,
	IAiEngineObservedReport,
	IAiEngineObservedSeat,
	IAiEngineObservedSeatTools,
	IAiEngineObservedToolEntry,
} from '@rocket.chat/core-typings';
import { Binary } from 'mongodb';

import {
	AiAgentValidationError,
	CHAT_ID_PATTERN,
	COMMIT_SHA_PATTERN,
	hasControlChar,
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

/** Engine report versions this workspace accepts. 1.2.0 adds per-seat tool ceilings and tool names. */
export const ENGINE_REPORT_CONTRACT_VERSIONS: readonly AiEngineReportContractVersion[] = ['1.1.0', '1.2.0'];

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
const MAX_TOOL_NAME_CHARS = 64;
const VALID_TOOL_EFFECTS = new Set<AiEngineToolEffect>(['read', 'change']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateToolIdList(raw: unknown): string[] | undefined {
	if (!Array.isArray(raw) || raw.length > MAX_TOOLS || !raw.every((t) => typeof t === 'string' && TOOL_ID_PATTERN.test(t))) {
		return undefined;
	}
	return [...new Set(raw as string[])];
}

/** 1.2.0 `catalogue.toolEntries`: exactly one `{id, name, effect}` per id in `catalogue.tools`. */
function validateReportToolEntries(raw: unknown, tools: readonly string[]): IAiEngineObservedToolEntry[] | undefined {
	if (!Array.isArray(raw) || raw.length !== tools.length) {
		return undefined;
	}
	const known = new Set(tools);
	const seen = new Set<string>();
	const entries: IAiEngineObservedToolEntry[] = [];
	for (const entry of raw) {
		if (!isPlainObject(entry)) {
			return undefined;
		}
		const { id, name, effect } = entry;
		if (typeof id !== 'string' || !known.has(id) || seen.has(id)) {
			return undefined;
		}
		if (typeof name !== 'string' || name.trim().length === 0 || Array.from(name).length > MAX_TOOL_NAME_CHARS || hasControlChar(name)) {
			return undefined;
		}
		if (typeof effect !== 'string' || !VALID_TOOL_EFFECTS.has(effect as AiEngineToolEffect)) {
			return undefined;
		}
		seen.add(id);
		entries.push({ id, name, effect: effect as AiEngineToolEffect });
	}
	return entries;
}

function validateReportCatalogue(
	rawCatalogue: unknown,
	contractVersion: AiEngineReportContractVersion,
): { ok: true; catalogue: IAiEngineObservedReport['catalogue'] } | { ok: false; error: string } {
	if (!isPlainObject(rawCatalogue)) {
		return { ok: false, error: 'catalogue-invalid' };
	}
	const { skillsCommit, skills, modelRoutes } = rawCatalogue;
	const tools = validateToolIdList(rawCatalogue.tools);
	if (!tools) {
		return { ok: false, error: 'catalogue-tools-invalid' };
	}
	let toolEntries: IAiEngineObservedToolEntry[] | undefined;
	if (contractVersion === '1.2.0') {
		toolEntries = validateReportToolEntries(rawCatalogue.toolEntries, tools);
		if (!toolEntries) {
			return { ok: false, error: 'catalogue-tool-entries-invalid' };
		}
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
			tools,
			...(toolEntries && { toolEntries }),
			skillsCommit,
			skills: [...new Set(skills)],
			modelRoutes: [...new Set(validatedRoutes)],
		},
	};
}

function validateReportSeatEntry(
	entry: unknown,
	seenSeatIds: Set<string>,
	contractVersion: AiEngineReportContractVersion,
	catalogueTools: readonly string[],
): { ok: true; seat: IAiEngineObservedSeat; allowedTools?: string[] } | { ok: false; error: string } {
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

	let allowedTools: string[] | undefined;
	if (contractVersion === '1.2.0') {
		allowedTools = validateToolIdList(entry.allowedTools);
		if (!allowedTools || !allowedTools.every((toolId) => catalogueTools.includes(toolId))) {
			return { ok: false, error: 'seat-tools-invalid' };
		}
		allowedTools.sort();
	}

	return {
		ok: true,
		...(allowedTools && { allowedTools }),
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
 * Validates an incoming `POST ai-agents.engine.report` body (contract 1.1.0 or 1.2.0) strictly against the wire schema.
 * Rejects mismatched `engineId`, other contract versions, invalid reason codes, or malformed arrays.
 * On 1.2.0 it also requires `seats[].allowedTools` (each inside `catalogue.tools`) and `catalogue.toolEntries`,
 * and returns every reported seat's tool ceiling in `seatTools`.
 */
export function validateEngineReport(
	raw: unknown,
	authenticatedEngineId: string,
): { ok: true; report: IAiEngineObservedReport } | { ok: false; error: string } {
	if (!isPlainObject(raw)) {
		return { ok: false, error: 'report-malformed' };
	}
	const contractVersion = ENGINE_REPORT_CONTRACT_VERSIONS.find((version) => version === raw.contractVersion);
	if (!contractVersion) {
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

	const catalogueResult = validateReportCatalogue(raw.catalogue, contractVersion);
	if (!catalogueResult.ok) {
		return catalogueResult;
	}

	if (!Array.isArray(raw.seats) || raw.seats.length > MAX_REPORT_SEATS) {
		return { ok: false, error: 'seats-invalid' };
	}

	const seats: IAiEngineObservedSeat[] = [];
	const seatTools: IAiEngineObservedSeatTools[] = [];
	const seenSeatIds = new Set<string>();
	for (const entry of raw.seats) {
		const seatResult = validateReportSeatEntry(entry, seenSeatIds, contractVersion, catalogueResult.catalogue.tools);
		if (!seatResult.ok) {
			return seatResult;
		}
		seats.push(seatResult.seat);
		if (seatResult.allowedTools) {
			seatTools.push({ seatId: seatResult.seat.seatId, allowedTools: seatResult.allowedTools });
		}
	}

	return {
		ok: true,
		report: {
			contractVersion,
			workspaceId: raw.workspaceId,
			reportedAt,
			catalogue: catalogueResult.catalogue,
			seats,
			...(contractVersion === '1.2.0' && { seatTools }),
		},
	};
}
