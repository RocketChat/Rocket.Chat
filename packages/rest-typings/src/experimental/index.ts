/**
 * Opt-in typings for experimental REST endpoints (`/api/experimental/...`).
 *
 * These are intentionally **not** merged into the `Endpoints` union exported
 * from the package root, so the stable typed client surface (`PathPattern`,
 * `Method`, `Path`, the SDK) stays free of unstable paths. Consumers who want
 * typed experimental calls import `ExperimentalEndpoints` explicitly.
 *
 * Endpoints under this namespace carry **no semver promise**: they may change
 * shape or be removed in any release without a deprecation cycle. See
 * `docs/experimental-api-endpoints.md`.
 *
 * Declare new experimental endpoints here, following the per-resource style of
 * the `/v1` endpoint types (e.g. `v1/calendar`). Every path key must begin with
 * `/experimental/`. For example:
 *
 * ```ts
 * export type ExperimentalEndpoints = {
 * 	'/experimental/example.info': {
 * 		GET: (params: { id: string }) => { id: string; value: number };
 * 	};
 * };
 * ```
 */
export type AiEngineCredentialSummary = {
	id: string;
	createdAt: string;
	expiresAt: string;
	revokedAt?: string;
};

export type AiEngineSummary = {
	_id: string;
	name: string;
	createdAt: string;
	credentials: AiEngineCredentialSummary[];
	lastReportAt?: string;
};

export type AiEngineNewCredential = {
	id: string;
	token: string;
	expiresAt: string;
};

export type AiReservedBotSummary = {
	_id: string;
	username: string;
};

export type AiSeatStateSummary = 'registered' | 'claimed' | 'retired';

export type AiSeatSummary = {
	_id: string;
	engineId: string;
	seatId: string;
	botUserId: string;
	allowedRoomIds: string[];
	allowedToolIds: string[];
	allowedRouteIds: string[];
	state: AiSeatStateSummary;
	registeredAt: string;
	agentId?: string;
	claimedAt?: string;
	retiredAt?: string;
};

export type AiAgentReadinessState =
	| 'incomplete'
	| 'published, waiting for engine'
	| 'engine ready, app not proved'
	| 'ready'
	| 'disabled'
	| 'retired'
	| 'bot-invalid'
	| 'room-invalid';

export type AiAgentSummary = {
	_id: string;
	engineId: string;
	seatId: string;
	seatState: AiSeatStateSummary;
	headVersion?: number;
	status?: 'draft' | 'published' | 'disabled';
	name?: string;
	rooms: string[];
	tools: string[];
	modelRoute?: string;
	readiness: AiAgentReadinessState;
	readinessReason?: string;
	engineConfirmed?: boolean;
	disagreement?: boolean;
	lastReportAt?: string;
	reportStale: boolean;
	createdAt: string;
};

export type AiAgentDetails = AiAgentSummary & {
	claim: string;
	instructions?: string;
	skills?: { commit: string; ids: string[] };
	memory?: { retentionDays: number };
	limits?: { perPersonHour: number; perPersonDay: number; dailySpendUsd: number };
	updatedAt?: string;
};

export type AiAgentRoomOption = {
	_id: string;
	name: string;
	fname?: string;
};

export type AiEngineSeatCounts = {
	engineId: string;
	engineName: string;
	registered: number;
	available: number;
	claimed: number;
	retired: number;
	disagreed: number;
	lastReportAt?: string;
	reportStale: boolean;
	allowedTools: string[];
	allowedRoutes: string[];
	skillsCommit?: string;
	skills: string[];
	eligibleRooms: AiAgentRoomOption[];
};

export type ExperimentalEndpoints = {
	'/experimental/ai-agents.engines': {
		GET: () => { engines: AiEngineSummary[] };
	};
	'/experimental/ai-agents.engines.link': {
		POST: (params: { name: string }) => { engine: AiEngineSummary; credential: AiEngineNewCredential };
	};
	'/experimental/ai-agents.engines.rotateCredential': {
		POST: (params: { engineId: string }) => { credential: AiEngineNewCredential };
	};
	'/experimental/ai-agents.engines.revokeCredential': {
		POST: (params: { engineId: string; credentialId: string }) => { success: true };
	};
	'/experimental/ai-agents.engines.reserveBots': {
		POST: (params: { engineId: string; count: number }) => { bots: AiReservedBotSummary[] };
	};
	'/experimental/ai-agents.seats.register': {
		POST: (params: {
			engineId: string;
			seatId: string;
			botUserId: string;
			allowedRoomIds: string[];
			allowedToolIds: string[];
			allowedRouteIds: string[];
		}) => { seat: AiSeatSummary };
	};
	'/experimental/ai-agents.seats.retire': {
		POST: (params: { seatId: string }) => { success: true };
	};
	'/experimental/ai-agents.list': {
		GET: () => { agents: AiAgentSummary[]; engines: AiEngineSeatCounts[] };
	};
	'/experimental/ai-agents.info': {
		GET: (params: { agentId: string }) => { agent: AiAgentDetails };
	};
	'/experimental/ai-agents.create': {
		POST: (params: {
			engineId: string;
			name: string;
			instructions: string;
			rooms: string[];
			tools: string[];
			modelRoute: string;
			skills?: string[];
		}) => { agent: AiAgentSummary; version: number };
	};
	'/experimental/ai-agents.retry': {
		POST: (params: {
			agentId: string;
			name: string;
			instructions: string;
			rooms: string[];
			tools: string[];
			modelRoute: string;
			skills?: string[];
		}) => { agent: AiAgentSummary; version: number };
	};
	'/experimental/ai-agents.disable': {
		POST: (params: { agentId: string }) => { agent: AiAgentSummary; version: number };
	};
	'/experimental/rooms.setCategory': {
		POST: (params: { roomIds: string[]; category: string | null }) => { success: true };
	};
};
