import type {
	AiEngineReportedSeatState,
	AiSeatState,
	IAiAgent,
	IAiEngine,
	IAiEngineObservedReport,
	IAiEngineObservedSeat,
	IAiSeat,
	IRoom,
	IUser,
} from '@rocket.chat/core-typings';
import type { AiAgentReadinessState, AiAgentToolOption } from '@rocket.chat/rest-typings';

export const ENGINE_REPORT_FRESHNESS_MS = 120_000;
export const VERSION_MAX_AHEAD_MS = 24 * 60 * 60 * 1000;

export type RoomEligibilityCandidate = Pick<
	IRoom,
	'_id' | 't' | 'ro' | 'federated' | 'broadcast' | 'encrypted' | 'archived' | 'teamMain' | 'prid' | 'abacAttributes'
> & {
	xmppFederation?: unknown;
};

/**
 * Step 3 ordinary public channel rule (aligned with room-package.json):
 * - `t === 'c'`
 * - none of `ro`, `federated`, `broadcast`, `encrypted`, `archived`, `teamMain` is `true` (absent/undefined is allowed)
 * - `xmppFederation` key is absent (whatever its value, including `false` or `null`)
 * - `prid` is absent/undefined
 * - `abacAttributes` is absent/undefined
 */
export function isOrdinaryPublicChannel(room: RoomEligibilityCandidate | null | undefined): boolean {
	if (!room) {
		return false;
	}
	if (room.t !== 'c') {
		return false;
	}
	if (
		room.ro === true ||
		room.federated === true ||
		room.broadcast === true ||
		room.encrypted === true ||
		room.archived === true ||
		room.teamMain === true
	) {
		return false;
	}
	if (Object.prototype.hasOwnProperty.call(room, 'xmppFederation')) {
		return false;
	}
	if (room.prid !== undefined) {
		return false;
	}
	if (room.abacAttributes !== undefined) {
		return false;
	}
	return true;
}

/**
 * Verifies a bot account matches the exact reserved-bot shape for `engineId` before registration or activation:
 * marker `aiAgents.engineId`, `type: 'bot'`, roles exactly `['bot']`, no password, no resume login tokens,
 * and no administrative deactivation reason.
 */
export function isReservedAgentBotValid(
	user: Pick<IUser, '_id' | 'type' | 'roles' | 'services' | 'aiAgents' | 'inactiveReason'> | null | undefined,
	engineId: string,
): boolean {
	if (!user) {
		return false;
	}
	if (user.type !== 'bot') {
		return false;
	}
	if (user.aiAgents?.engineId !== engineId) {
		return false;
	}
	if (!Array.isArray(user.roles) || user.roles.length !== 1 || user.roles[0] !== 'bot') {
		return false;
	}
	if (user.services?.password !== undefined) {
		return false;
	}
	const loginTokens = user.services?.resume?.loginTokens;
	if (Array.isArray(loginTokens) && loginTokens.length > 0) {
		return false;
	}
	if (user.inactiveReason !== undefined) {
		return false;
	}
	return true;
}

export function isEngineReportFresh(lastReportAt: Date | undefined, nowMs: number = Date.now()): boolean {
	if (!lastReportAt) {
		return false;
	}
	const ageMs = nowMs - lastReportAt.getTime();
	return ageMs >= -60_000 && ageMs <= ENGINE_REPORT_FRESHNESS_MS;
}

/**
 * The tools the engine last published for one seat. The engine owns which tools exist and which a seat may use;
 * this workspace keeps no list of its own. Report 1.2.0 names each seat's tools; report 1.1.0 only lists the
 * catalogue, which is then the ceiling for every seat. Returns an empty list when there is no report or the
 * 1.2.0 report does not name the seat, so nothing outside the engine's word is ever allowed.
 */
export function getObservedSeatToolCeiling(observed: IAiEngineObservedReport | undefined, seatId: string): readonly string[] {
	if (!observed) {
		return [];
	}
	if (observed.contractVersion === '1.1.0') {
		return observed.catalogue.tools;
	}
	return observed.seatTools?.find((entry) => entry.seatId === seatId)?.allowedTools ?? [];
}

export function areToolsWithinObservedSeatCeiling(
	toolIds: readonly string[],
	observed: IAiEngineObservedReport | undefined,
	seatId: string,
): boolean {
	const ceiling = getObservedSeatToolCeiling(observed, seatId);
	return toolIds.every((toolId) => ceiling.includes(toolId));
}

/** The tools a seat can actually be given now: its registry list, cut down to what the engine last published for it. */
export function getEffectiveSeatTools(
	seat: Pick<IAiSeat, 'seatId' | 'allowedToolIds'>,
	observed: IAiEngineObservedReport | undefined,
): string[] {
	const ceiling = getObservedSeatToolCeiling(observed, seat.seatId);
	return seat.allowedToolIds.filter((toolId) => ceiling.includes(toolId));
}

/**
 * Tool picker options, sorted by id: the engine's name for each tool when the report gives one (1.2.0), the id otherwise.
 * `withdrawnIds` are tools an agent already has that its seat no longer offers; they are listed and marked so a person can
 * remove them, never offered for adding.
 */
export function toObservedToolOptions(
	offeredIds: readonly string[],
	observed: IAiEngineObservedReport | undefined,
	withdrawnIds: readonly string[] = [],
): AiAgentToolOption[] {
	const names = new Map((observed?.catalogue.toolEntries ?? []).map((entry) => [entry.id, entry.name]));
	const offered = new Set(offeredIds);
	return [...new Set([...offeredIds, ...withdrawnIds])].sort().map((id) => ({
		id,
		name: names.get(id) ?? id,
		...(!offered.has(id) && { withdrawn: true }),
	}));
}

const REGISTRY_TO_EXPECTED_OBSERVED_STATE: Record<AiSeatState, AiEngineReportedSeatState> = {
	registered: 'provisioned',
	claimed: 'claimed',
	retired: 'retired',
};

function sameStringSet(a: readonly string[], b: readonly string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	const setA = new Set(a);
	if (setA.size !== b.length) {
		return false;
	}
	return b.every((item) => setA.has(item));
}

/**
 * Deny-only observation check comparing a registered seat against the engine's latest reported entry.
 * An observation can only deny availability or flag disagreement; it never authorizes a seat, bot, room, tool, or route.
 * For a `claimed` seat whose head was just published, `provisioned` is a normal transient state before the engine
 * completes its next poll cycle; `retired` or mismatched bot/rooms is always a disagreement.
 */
export function doesObservationDisagreeWithSeat(seat: IAiSeat, observed: IAiEngineObservedSeat | undefined): boolean {
	if (!observed) {
		return true;
	}
	if (observed.botId !== seat.botUserId) {
		return true;
	}
	if (!sameStringSet(seat.allowedRoomIds, observed.allowedRooms)) {
		return true;
	}
	if (seat.state === 'claimed') {
		return observed.state !== 'claimed' && observed.state !== 'provisioned';
	}
	return observed.state !== REGISTRY_TO_EXPECTED_OBSERVED_STATE[seat.state];
}

const BLOCKING_OBSERVED_REASONS = new Set(['fence-closed', 'seat-poisoned', 'seat-no-model-route']);

export function isSeatClaimableByObservation(
	seat: IAiSeat,
	engine: Pick<IAiEngine, 'observed' | 'lastReportAt'>,
	nowMs: number = Date.now(),
): boolean {
	if (seat.state !== 'registered') {
		return false;
	}
	if (!isEngineReportFresh(engine.lastReportAt, nowMs) || !engine.observed) {
		return false;
	}
	const observed = engine.observed.seats.find((entry) => entry.seatId === seat.seatId);
	if (!observed) {
		return false;
	}
	if (doesObservationDisagreeWithSeat(seat, observed)) {
		return false;
	}
	if (BLOCKING_OBSERVED_REASONS.has(observed.reason)) {
		return false;
	}
	return true;
}

/**
 * Deny-only observation check for Retry on an already-claimed seat.
 * Refuses if the latest report is missing/stale, omits the seat, disagrees on botId/allowedRooms/state
 * (allowing `claimed` and the transient `provisioned` resume window, never `retired` or `unprovisioned`),
 * or carries a blocking engine reason (`fence-closed`, `seat-poisoned`, `seat-no-model-route`).
 */
export function isClaimedSeatObservationAcceptable(
	seat: IAiSeat,
	engine: Pick<IAiEngine, 'observed' | 'lastReportAt'>,
	nowMs: number = Date.now(),
): { ok: true } | { ok: false; reason: string } {
	if (seat.state !== 'claimed') {
		return { ok: false, reason: 'seat-not-claimed' };
	}
	if (!isEngineReportFresh(engine.lastReportAt, nowMs) || !engine.observed) {
		return { ok: false, reason: 'report-stale' };
	}
	const observed = engine.observed.seats.find((entry) => entry.seatId === seat.seatId);
	if (!observed) {
		return { ok: false, reason: 'observation-missing' };
	}
	if (doesObservationDisagreeWithSeat(seat, observed)) {
		return { ok: false, reason: 'observation-disagrees' };
	}
	if (BLOCKING_OBSERVED_REASONS.has(observed.reason)) {
		return { ok: false, reason: observed.reason };
	}
	return { ok: true };
}

export function deriveAgentReadiness(
	agent: Pick<IAiAgent, 'headVersion' | 'status'>,
	seat: IAiSeat | undefined,
	engine: Pick<IAiEngine, 'observed' | 'lastReportAt'> | undefined,
	nowMs: number = Date.now(),
	integrity: { botInvalid?: boolean; roomInvalid?: boolean } = {},
): {
	readiness: AiAgentReadinessState;
	readinessReason?: string;
	engineConfirmed?: boolean;
	disagreement: boolean;
	reportStale: boolean;
} {
	const reportStale = !isEngineReportFresh(engine?.lastReportAt, nowMs);
	const observed = engine?.observed?.seats.find((entry) => entry.seatId === seat?.seatId);
	const disagreement = seat ? doesObservationDisagreeWithSeat(seat, observed) : true;

	if (seat?.state === 'retired') {
		return {
			readiness: 'retired',
			readinessReason: observed?.reason ?? 'seat-retired',
			disagreement,
			reportStale,
		};
	}

	if (agent.status === 'disabled' && agent.headVersion !== undefined) {
		const engineConfirmed = Boolean(observed && observed.acceptedVersion >= agent.headVersion);
		return {
			readiness: 'disabled',
			readinessReason: engineConfirmed ? (observed?.reason ?? 'record-disabled') : 'awaiting-engine-confirmation',
			engineConfirmed,
			disagreement,
			reportStale,
		};
	}

	if (integrity.botInvalid) {
		return {
			readiness: 'bot-invalid',
			readinessReason: 'bot-invalid',
			disagreement,
			reportStale,
		};
	}

	if (integrity.roomInvalid) {
		return {
			readiness: 'room-invalid',
			readinessReason: 'room-invalid',
			disagreement,
			reportStale,
		};
	}

	if (agent.headVersion === undefined) {
		return {
			readiness: 'incomplete',
			readinessReason: 'head-not-published',
			disagreement,
			reportStale,
		};
	}

	if (!observed || observed.acceptedVersion < agent.headVersion) {
		return {
			readiness: 'published, waiting for engine',
			readinessReason: observed?.reason ?? 'waiting-for-engine',
			engineConfirmed: false,
			disagreement,
			reportStale,
		};
	}

	if (observed.admittedQuestionSeen) {
		return {
			readiness: 'ready',
			readinessReason: observed.reason,
			engineConfirmed: true,
			disagreement,
			reportStale,
		};
	}

	return {
		readiness: 'engine ready, app not proved',
		readinessReason: observed.identity120Seen ? 'awaiting-first-question' : 'awaiting-app-proof',
		engineConfirmed: true,
		disagreement,
		reportStale,
	};
}
