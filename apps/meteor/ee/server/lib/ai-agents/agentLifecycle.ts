import { randomUUID } from 'node:crypto';

import { Authorization } from '@rocket.chat/core-services';
import type { IAiAgent, IAiEngine, IAiSeat, IAuditServerActor, IRoom, IUser } from '@rocket.chat/core-typings';
import { AiAgentRevisions, AiAgents, AiEngines, AiSeats, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type {
	AiAgentDetails,
	AiAgentRoomOption,
	AiAgentSummary,
	AiAgentToolOption,
	AiEngineSeatCounts,
	AiSeatSummary,
} from '@rocket.chat/rest-typings';

import { recordAiAgentAuditEvent } from './audit';
import { buildAgentRecord110, parseStoredRecord110 } from './recordContract';
import {
	areToolsWithinObservedSeatCeiling,
	deriveAgentReadiness,
	getEffectiveSeatTools,
	doesObservationDisagreeWithSeat,
	isClaimedSeatObservationAcceptable,
	isEngineReportFresh,
	isOrdinaryPublicChannel,
	isReservedAgentBotValid,
	isSeatClaimableByObservation,
	toObservedToolOptions,
	VERSION_MAX_AHEAD_MS,
} from './seatValidation';
import {
	AiAgentValidationError,
	CHAT_ID_PATTERN,
	COMMIT_SHA_PATTERN,
	formatModelRoute,
	MAX_CHAT_ROOMS,
	MAX_ROUTES,
	MAX_SKILLS,
	MAX_TOOLS,
	parseModelRoute,
	SEAT_ID_PATTERN,
	SKILL_ID_PATTERN,
	TOOL_ID_PATTERN,
	validateAgentInstructions,
	validateAgentName,
	validateModelRouteId,
	validateUniqueIds,
} from './textValidation';
import { addUsersToRoomMethod, assertCanAddUsersToRoom } from '../../../../server/meteor-methods/rooms/addUsersToRoom';

export class AiAgentActionError extends Error {
	readonly errorType: string;

	readonly statusCode: 400 | 403 | 404 | 409;

	constructor(errorType: string, message: string, statusCode: 400 | 403 | 404 | 409 = 400) {
		super(message);
		this.name = 'AiAgentActionError';
		this.errorType = errorType;
		this.statusCode = statusCode;
	}
}

function isDuplicateKeyError(error: unknown): boolean {
	return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: unknown }).code === 11000);
}

export function toSeatSummary(seat: IAiSeat): AiSeatSummary {
	return {
		_id: seat._id,
		engineId: seat.engineId,
		seatId: seat.seatId,
		botUserId: seat.botUserId,
		allowedRoomIds: [...seat.allowedRoomIds],
		allowedToolIds: [...seat.allowedToolIds],
		allowedRouteIds: [...seat.allowedRouteIds],
		state: seat.state,
		registeredAt: seat.registeredAt.toISOString(),
		...(seat.agentId && { agentId: seat.agentId }),
		...(seat.claimedAt && { claimedAt: seat.claimedAt.toISOString() }),
		...(seat.retiredAt && { retiredAt: seat.retiredAt.toISOString() }),
	};
}

export async function registerSeatForEngine(
	params: {
		engineId: string;
		seatId: string;
		botUserId: string;
		allowedRoomIds: string[];
		allowedToolIds: string[];
		allowedRouteIds: string[];
	},
	actor: { userId: string; auditActor: IAuditServerActor },
	now: Date = new Date(),
): Promise<AiSeatSummary> {
	if (!SEAT_ID_PATTERN.test(params.seatId)) {
		throw new AiAgentActionError('error-ai-seat-id-invalid', 'Seat id is invalid');
	}

	const engine = await AiEngines.findOneById(params.engineId, { projection: { _id: 1, observed: 1, lastReportAt: 1 } });
	if (!engine) {
		throw new AiAgentActionError('error-ai-engine-not-found', 'Engine not found', 404);
	}

	let allowedRoomIds: string[];
	let allowedToolIds: string[];
	let allowedRouteIds: string[];
	try {
		allowedRoomIds = validateUniqueIds(params.allowedRoomIds, {
			min: 1,
			max: MAX_CHAT_ROOMS,
			pattern: CHAT_ID_PATTERN,
			invalidCode: 'room-list-invalid',
			duplicateCode: 'duplicate-room',
		});
		allowedToolIds = validateUniqueIds(params.allowedToolIds, {
			min: 0,
			max: MAX_TOOLS,
			pattern: TOOL_ID_PATTERN,
			invalidCode: 'tool-list-invalid',
			duplicateCode: 'duplicate-tool',
		});
		if (!Array.isArray(params.allowedRouteIds) || params.allowedRouteIds.length < 1 || params.allowedRouteIds.length > MAX_ROUTES) {
			throw new AiAgentValidationError('route-invalid');
		}
		const seenRoutes = new Set<string>();
		allowedRouteIds = params.allowedRouteIds.map((route) => {
			const validated = validateModelRouteId(route);
			if (seenRoutes.has(validated)) {
				throw new AiAgentValidationError('duplicate-route');
			}
			seenRoutes.add(validated);
			return validated;
		});
	} catch (error) {
		const code = error instanceof AiAgentValidationError ? error.code : 'seat-invalid';
		throw new AiAgentActionError(`error-ai-${code}`, `Invalid seat configuration (${code})`);
	}

	// Registering always needs a current engine report, with or without tools. A seat's tools are what the engine
	// last published for this seat; there is no built-in list to fall back to.
	if (!isEngineReportFresh(engine.lastReportAt, now.getTime()) || !engine.observed) {
		throw new AiAgentActionError('error-ai-engine-report-stale', 'Engine has not reported within the last 120 seconds');
	}
	if (!areToolsWithinObservedSeatCeiling(allowedToolIds, engine.observed, params.seatId)) {
		throw new AiAgentActionError('error-ai-tool-not-allowed', 'Invalid seat configuration (tool-not-allowed)');
	}

	const bot = await Users.findOneById(params.botUserId, {
		projection: { _id: 1, type: 1, roles: 1, active: 1, aiAgents: 1, services: 1 },
	});
	if (!isReservedAgentBotValid(bot, params.engineId) || bot?.active !== false) {
		throw new AiAgentActionError('error-ai-bot-invalid', 'Bot is not an inactive reserved bot for this engine');
	}

	for (const roomId of allowedRoomIds) {
		const room = await Rooms.findOneById(roomId, {
			projection: {
				_id: 1,
				t: 1,
				ro: 1,
				federated: 1,
				broadcast: 1,
				encrypted: 1,
				archived: 1,
				teamMain: 1,
				prid: 1,
				abacAttributes: 1,
				xmppFederation: 1,
			},
		});
		if (!isOrdinaryPublicChannel(room)) {
			throw new AiAgentActionError('error-ai-room-not-eligible', 'Room is not an eligible ordinary public channel');
		}
		const banned = await Subscriptions.findOneBannedSubscription(roomId, params.botUserId);
		if (banned) {
			throw new AiAgentActionError('error-ai-bot-banned', 'Bot is banned from an allowed room');
		}
	}

	try {
		const { insertedId } = await AiSeats.registerSeat({
			engineId: params.engineId,
			seatId: params.seatId,
			botUserId: params.botUserId,
			allowedRoomIds,
			allowedToolIds,
			allowedRouteIds,
			registeredBy: actor.userId,
			registeredAt: now,
		});

		await recordAiAgentAuditEvent(
			{
				action: 'seat.register',
				engineId: params.engineId,
				seatId: params.seatId,
				botUserIds: [params.botUserId],
				roomIds: allowedRoomIds,
			},
			actor.auditActor,
		);

		return {
			_id: insertedId,
			engineId: params.engineId,
			seatId: params.seatId,
			botUserId: params.botUserId,
			allowedRoomIds,
			allowedToolIds,
			allowedRouteIds,
			state: 'registered',
			registeredAt: now.toISOString(),
		};
	} catch (error) {
		if (isDuplicateKeyError(error)) {
			throw new AiAgentActionError('error-ai-seat-already-exists', 'Seat id or bot is already registered', 409);
		}
		throw error;
	}
}

export async function retireSeatById(seatId: string, actor: { userId: string; auditActor: IAuditServerActor }): Promise<void> {
	if (!SEAT_ID_PATTERN.test(seatId)) {
		throw new AiAgentActionError('error-ai-seat-id-invalid', 'Seat id is invalid');
	}
	const seat = await AiSeats.findOneBySeatId(seatId, { projection: { engineId: 1, state: 1 } });
	if (!seat) {
		throw new AiAgentActionError('error-ai-seat-not-found', 'Seat not found', 404);
	}
	const { modifiedCount } = await AiSeats.retireSeat(seatId, actor.userId, new Date());
	if (!modifiedCount) {
		throw new AiAgentActionError('error-ai-seat-already-retired', 'Seat is already retired', 409);
	}
	await recordAiAgentAuditEvent(
		{
			action: 'seat.retire',
			engineId: seat.engineId,
			seatId,
		},
		actor.auditActor,
	);
}

async function verifyActorRooms(roomIds: string[], actorUser: IUser): Promise<IRoom[]> {
	const rooms: IRoom[] = [];
	for (const roomId of roomIds) {
		const room = await Rooms.findOneById(roomId);
		if (!isOrdinaryPublicChannel(room) || !room) {
			throw new AiAgentActionError('error-ai-room-not-eligible', 'Room is not an eligible ordinary public channel');
		}
		const canAccess = await Authorization.canAccessRoom(room, actorUser);
		if (!canAccess) {
			throw new AiAgentActionError('error-ai-room-access-denied', 'You cannot access one of the requested rooms', 403);
		}
		try {
			await assertCanAddUsersToRoom(actorUser._id, room);
		} catch {
			throw new AiAgentActionError('error-ai-room-invite-denied', 'You cannot add users to one of the requested rooms', 403);
		}
		rooms.push(room);
	}
	return rooms;
}

function validateAgentConfigInput(params: {
	name: string;
	instructions: string;
	rooms: string[];
	tools: string[];
	modelRoute: string;
	skills?: string[];
}) {
	try {
		const name = validateAgentName(params.name);
		const instructions = validateAgentInstructions(params.instructions);
		const rooms = validateUniqueIds(params.rooms, {
			min: 1,
			max: MAX_CHAT_ROOMS,
			pattern: CHAT_ID_PATTERN,
			invalidCode: 'room-list-invalid',
			duplicateCode: 'duplicate-room',
		});
		const tools = validateUniqueIds(params.tools, {
			min: 0,
			max: MAX_TOOLS,
			pattern: TOOL_ID_PATTERN,
			invalidCode: 'tool-list-invalid',
			duplicateCode: 'duplicate-tool',
		});
		const modelRoute = validateModelRouteId(params.modelRoute);
		const skills = validateUniqueIds(params.skills ?? [], {
			min: 0,
			max: MAX_SKILLS,
			pattern: SKILL_ID_PATTERN,
			invalidCode: 'skill-list-invalid',
			duplicateCode: 'duplicate-skill',
		});
		return { name, instructions, rooms, tools, modelRoute, skills };
	} catch (error) {
		const code = error instanceof AiAgentValidationError ? error.code : 'invalid-input';
		// Fixed refusal code only; never echo user-supplied text or secret-shaped values.
		throw new AiAgentActionError(`error-ai-${code}`, `Invalid agent configuration (${code})`);
	}
}

async function activateAndJoinAndPublish(params: {
	agent: Pick<IAiAgent, '_id' | 'engineId' | 'seatId' | 'claim' | 'createdAt'>;
	seat: IAiSeat;
	engine: IAiEngine;
	validated: {
		name: string;
		instructions: string;
		rooms: string[];
		tools: string[];
		modelRoute: string;
		skills: string[];
	};
	actorUser: IUser;
	auditActor: IAuditServerActor;
	auditAction: 'agent.create' | 'agent.retry';
	now: Date;
}): Promise<{ agent: AiAgentSummary; version: number }> {
	const { agent, seat, engine, validated, actorUser, auditActor, auditAction, now } = params;

	const skillsCommit = engine.observed?.catalogue.skillsCommit;
	if (!skillsCommit || !COMMIT_SHA_PATTERN.test(skillsCommit)) {
		throw new AiAgentActionError('error-ai-engine-report-invalid', 'Engine catalogue does not report a valid skills commit');
	}
	const observedSkills = new Set(engine.observed?.catalogue.skills ?? []);
	if (!validated.skills.every((skillId) => observedSkills.has(skillId))) {
		throw new AiAgentActionError('error-ai-skill-not-available', 'Requested skill is not available on this engine');
	}

	// Step 4: Activate the registry bot in one conditional update (always reading botUserId from the seat registry).
	const bot = await Users.findOneById(seat.botUserId, {
		projection: { _id: 1, username: 1, type: 1, roles: 1, aiAgents: 1, services: 1 },
	});
	if (!bot?.username) {
		throw new AiAgentActionError('error-ai-bot-invalid', 'Seat bot account is missing or has no username');
	}
	const activation = await Users.activateReservedAgentBot(seat.botUserId, engine._id, validated.name);
	if (activation.matchedCount !== 1) {
		throw new AiAgentActionError('error-ai-bot-invalid', 'Seat bot account failed reserved-bot integrity checks');
	}

	// Step 5: Join bot to every requested room through addUsersToRoomMethod, then read back membership & ban status.
	for (const roomId of validated.rooms) {
		const bannedBefore = await Subscriptions.findOneBannedSubscription(roomId, seat.botUserId);
		if (bannedBefore) {
			throw new AiAgentActionError('error-ai-bot-banned', 'Seat bot is banned from a requested room');
		}

		const existingSub = await Subscriptions.findOneByRoomIdAndUserId(roomId, seat.botUserId, { projection: { _id: 1 } });
		if (!existingSub) {
			try {
				await addUsersToRoomMethod(actorUser._id, { rid: roomId, users: [bot.username] }, actorUser);
			} catch {
				throw new AiAgentActionError('error-ai-room-join-failed', 'Failed to join seat bot to a requested room');
			}
		}

		const [subAfter, bannedAfter] = await Promise.all([
			Subscriptions.findOneByRoomIdAndUserId(roomId, seat.botUserId, { projection: { _id: 1 } }),
			Subscriptions.findOneBannedSubscription(roomId, seat.botUserId),
		]);
		if (!subAfter || bannedAfter) {
			throw new AiAgentActionError('error-ai-room-join-failed', 'Seat bot room membership could not be confirmed');
		}
	}

	// Step 6: Allocate version with $$NOW 1-day bound, insert immutable 1.1.0 revision, CAS head, write audit.
	const version = await AiAgents.allocateVersionById(agent._id, VERSION_MAX_AHEAD_MS);
	if (version === null) {
		throw new AiAgentActionError('error-ai-version-clock-skew', 'Agent version counter is too far ahead of database time', 409);
	}

	const built = buildAgentRecord110({
		id: seat.seatId,
		version,
		updatedAt: now.toISOString(),
		name: validated.name,
		instructions: validated.instructions,
		model: parseModelRoute(validated.modelRoute),
		tools: validated.tools,
		skills: {
			commit: skillsCommit,
			ids: validated.skills,
		},
		status: 'published',
		chat: {
			claim: agent.claim,
			rooms: validated.rooms,
		},
	});

	await AiAgentRevisions.insertOne({
		agentId: agent._id,
		version,
		bytes: built.binary,
		digest: built.digest,
		status: 'published',
		actor: actorUser._id,
		action: 'create',
		ts: now,
	});

	const headSwap = await AiAgents.setHeadVersionById(agent._id, undefined, { version, status: 'published' });
	if (headSwap.modifiedCount !== 1) {
		throw new AiAgentActionError('error-ai-head-conflict', 'Agent head version changed concurrently', 409);
	}

	await recordAiAgentAuditEvent(
		{
			action: auditAction,
			engineId: engine._id,
			seatId: seat.seatId,
			agentId: agent._id,
			version,
			botUserIds: [seat.botUserId],
			roomIds: validated.rooms,
		},
		auditActor,
	);

	const readinessInfo = deriveAgentReadiness({ headVersion: version, status: 'published' }, seat, engine, now.getTime());

	return {
		version,
		agent: {
			_id: agent._id,
			engineId: engine._id,
			seatId: seat.seatId,
			seatState: 'claimed',
			headVersion: version,
			status: 'published',
			name: validated.name,
			rooms: [...validated.rooms],
			tools: [...validated.tools],
			modelRoute: validated.modelRoute,
			readiness: readinessInfo.readiness,
			...(readinessInfo.readinessReason && { readinessReason: readinessInfo.readinessReason }),
			...(readinessInfo.engineConfirmed !== undefined && { engineConfirmed: readinessInfo.engineConfirmed }),
			disagreement: readinessInfo.disagreement,
			...(engine.lastReportAt && { lastReportAt: engine.lastReportAt.toISOString() }),
			reportStale: readinessInfo.reportStale,
			createdAt: agent.createdAt.toISOString(),
		},
	};
}

export async function createAiAgent(
	params: {
		engineId: string;
		name: string;
		instructions: string;
		rooms: string[];
		tools: string[];
		modelRoute: string;
		skills?: string[];
	},
	actor: { user: IUser; auditActor: IAuditServerActor },
	now: Date = new Date(),
): Promise<{ agent: AiAgentSummary; version: number }> {
	const validated = validateAgentConfigInput(params);

	const engine = await AiEngines.findOneById(params.engineId);
	if (!engine) {
		throw new AiAgentActionError('error-ai-engine-not-found', 'Engine not found', 404);
	}
	if (!isEngineReportFresh(engine.lastReportAt, now.getTime()) || !engine.observed) {
		throw new AiAgentActionError('error-ai-engine-report-stale', 'Engine has not reported within the last 120 seconds');
	}
	const publishedTools = engine.observed.catalogue.tools;
	if (!validated.tools.every((toolId) => publishedTools.includes(toolId))) {
		throw new AiAgentActionError('error-ai-tool-not-allowed', 'Requested tool is not published by this engine');
	}

	await verifyActorRooms(validated.rooms, actor.user);

	// Step 3: Pick a registered seat whose registry allowlists cover the request and whose observation does not disagree.
	// Tools are checked last so a refusal can say when tools were the only reason no seat fits.
	const allSeats = await AiSeats.findByEngineId(engine._id).toArray();
	const candidates: IAiSeat[] = [];
	let seatFitExceptTools = false;
	for (const seat of allSeats) {
		if (seat.state !== 'registered') {
			continue;
		}
		if (!validated.rooms.every((roomId) => seat.allowedRoomIds.includes(roomId))) {
			continue;
		}
		if (!seat.allowedRouteIds.includes(validated.modelRoute)) {
			continue;
		}
		if (!isSeatClaimableByObservation(seat, engine, now.getTime())) {
			continue;
		}
		const existingAgent = await AiAgents.findOneBySeatId(seat.seatId, { projection: { _id: 1 } });
		if (existingAgent) {
			continue;
		}
		const seatTools = getEffectiveSeatTools(seat, engine.observed);
		if (!validated.tools.every((toolId) => seatTools.includes(toolId))) {
			seatFitExceptTools = true;
			continue;
		}
		candidates.push(seat);
	}

	if (candidates.length === 0 && seatFitExceptTools) {
		throw new AiAgentActionError('error-ai-no-seat-offers-all-tools', 'No single available seat offers every chosen tool', 409);
	}
	if (candidates.length === 0) {
		throw new AiAgentActionError('error-ai-no-seat-available', 'No eligible registered seat is available for this request', 409);
	}

	// Attempt claim on first candidate, retrying at most once on the next candidate if CAS loses.
	let claimedSeat: IAiSeat | undefined;
	let insertedAgent: Pick<IAiAgent, '_id' | 'engineId' | 'seatId' | 'claim' | 'createdAt'> | undefined;
	const maxAttempts = Math.min(2, candidates.length);

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const candidate = candidates[attempt];
		const agentId = Random.id();
		const claim = randomUUID();
		try {
			await AiAgents.insertOne({
				_id: agentId,
				engineId: engine._id,
				seatId: candidate.seatId,
				claim,
				lastVersion: 0,
				createdBy: actor.user._id,
				createdAt: now,
			});
		} catch (error) {
			if (isDuplicateKeyError(error)) {
				continue;
			}
			throw error;
		}

		const claimResult = await AiSeats.claimSeat(candidate.seatId, agentId, now);
		if (claimResult.modifiedCount === 1) {
			claimedSeat = { ...candidate, state: 'claimed', agentId, claimedAt: now };
			insertedAgent = { _id: agentId, engineId: engine._id, seatId: candidate.seatId, claim, createdAt: now };
			break;
		}

		// Lost CAS: remove the uncommitted agent document and try the next candidate once.
		await AiAgents.deleteOneUncommittedById(agentId);
	}

	if (!claimedSeat || !insertedAgent) {
		throw new AiAgentActionError('error-ai-seat-claim-conflict', 'Available seat was claimed concurrently', 409);
	}

	return activateAndJoinAndPublish({
		agent: insertedAgent,
		seat: claimedSeat,
		engine,
		validated,
		actorUser: actor.user,
		auditActor: actor.auditActor,
		auditAction: 'agent.create',
		now,
	});
}

export async function retryAiAgent(
	params: {
		agentId: string;
		name: string;
		instructions: string;
		rooms: string[];
		tools: string[];
		modelRoute: string;
		skills?: string[];
	},
	actor: { user: IUser; auditActor: IAuditServerActor },
	now: Date = new Date(),
): Promise<{ agent: AiAgentSummary; version: number }> {
	const validated = validateAgentConfigInput(params);

	const agent = await AiAgents.findOneById(params.agentId);
	if (!agent) {
		throw new AiAgentActionError('error-ai-agent-not-found', 'Agent not found', 404);
	}
	if (agent.headVersion !== undefined) {
		throw new AiAgentActionError('error-ai-agent-already-published', 'Agent already has a published revision', 409);
	}

	// Retry ALWAYS resumes the same claimed seat — never picks another seat and never touches a retired seat.
	const seat = await AiSeats.findOneBySeatId(agent.seatId);
	if (!seat || seat.engineId !== agent.engineId || seat.state !== 'claimed' || seat.agentId !== agent._id) {
		throw new AiAgentActionError('error-ai-seat-not-claimed', 'Agent seat is not claimed by this agent', 409);
	}

	const engine = await AiEngines.findOneById(agent.engineId);
	if (!engine) {
		throw new AiAgentActionError('error-ai-engine-not-found', 'Engine not found', 404);
	}
	if (!isEngineReportFresh(engine.lastReportAt, now.getTime()) || !engine.observed) {
		throw new AiAgentActionError('error-ai-engine-report-stale', 'Engine has not reported within the last 120 seconds');
	}
	const observationCheck = isClaimedSeatObservationAcceptable(seat, engine, now.getTime());
	if (!observationCheck.ok) {
		throw new AiAgentActionError('error-ai-engine-disagrees', `Engine observation refused retry (${observationCheck.reason})`, 409);
	}

	if (!validated.rooms.every((roomId) => seat.allowedRoomIds.includes(roomId))) {
		throw new AiAgentActionError('error-ai-room-not-allowed', 'Requested room is outside this seat allowlist');
	}
	const seatTools = getEffectiveSeatTools(seat, engine.observed);
	if (!validated.tools.every((toolId) => seatTools.includes(toolId))) {
		throw new AiAgentActionError('error-ai-tool-not-allowed', 'Requested tool is not offered by this seat');
	}
	if (!seat.allowedRouteIds.includes(validated.modelRoute)) {
		throw new AiAgentActionError('error-ai-route-not-allowed', 'Requested model route is outside this seat allowlist');
	}

	await verifyActorRooms(validated.rooms, actor.user);

	return activateAndJoinAndPublish({
		agent,
		seat,
		engine,
		validated,
		actorUser: actor.user,
		auditActor: actor.auditActor,
		auditAction: 'agent.retry',
		now,
	});
}

export async function disableAiAgent(
	agentId: string,
	actor: { userId: string; auditActor: IAuditServerActor },
	now: Date = new Date(),
): Promise<{ agent: AiAgentSummary; version: number }> {
	const agent = await AiAgents.findOneById(agentId);
	if (!agent) {
		throw new AiAgentActionError('error-ai-agent-not-found', 'Agent not found', 404);
	}
	if (agent.headVersion === undefined) {
		throw new AiAgentActionError('error-ai-agent-not-published', 'Agent has no published revision to disable', 409);
	}
	if (agent.status === 'disabled') {
		throw new AiAgentActionError('error-ai-agent-already-disabled', 'Agent is already disabled', 409);
	}

	const currentRevision = await AiAgentRevisions.findOneByAgentIdAndVersion(agent._id, agent.headVersion);
	if (!currentRevision) {
		throw new AiAgentActionError('error-ai-head-revision-missing', 'Current head revision is unavailable', 409);
	}
	const currentRecord = parseStoredRecord110(currentRevision.bytes);
	if (!currentRecord) {
		throw new AiAgentActionError('error-ai-head-revision-invalid', 'Current head revision cannot be parsed', 409);
	}

	const version = await AiAgents.allocateVersionById(agent._id, VERSION_MAX_AHEAD_MS);
	if (version === null) {
		throw new AiAgentActionError('error-ai-version-clock-skew', 'Agent version counter is too far ahead of database time', 409);
	}

	const built = buildAgentRecord110({
		id: currentRecord.id,
		version,
		updatedAt: now.toISOString(),
		name: currentRecord.name,
		instructions: currentRecord.instructions,
		model: currentRecord.model,
		tools: currentRecord.tools,
		skills: currentRecord.skills,
		memory: currentRecord.memory,
		limits: currentRecord.limits,
		status: 'disabled',
		chat: currentRecord.chat,
	});

	await AiAgentRevisions.insertOne({
		agentId: agent._id,
		version,
		bytes: built.binary,
		digest: built.digest,
		status: 'disabled',
		actor: actor.userId,
		action: 'disable',
		ts: now,
	});

	const headSwap = await AiAgents.setHeadVersionById(agent._id, agent.headVersion, { version, status: 'disabled' });
	if (headSwap.modifiedCount !== 1) {
		throw new AiAgentActionError('error-ai-head-conflict', 'Agent head version changed concurrently', 409);
	}

	await recordAiAgentAuditEvent(
		{
			action: 'agent.disable',
			engineId: agent.engineId,
			seatId: agent.seatId,
			agentId: agent._id,
			version,
		},
		actor.auditActor,
	);

	const [seat, engine] = await Promise.all([
		AiSeats.findOneBySeatId(agent.seatId),
		AiEngines.findOneById(agent.engineId, { projection: { observed: 1, lastReportAt: 1 } }),
	]);
	const readinessInfo = deriveAgentReadiness(
		{ headVersion: version, status: 'disabled' },
		seat ?? undefined,
		engine ?? undefined,
		now.getTime(),
	);

	return {
		version,
		agent: {
			_id: agent._id,
			engineId: agent.engineId,
			seatId: agent.seatId,
			seatState: seat?.state ?? 'claimed',
			headVersion: version,
			status: 'disabled',
			name: currentRecord.name,
			rooms: [...currentRecord.chat.rooms],
			tools: [...currentRecord.tools],
			modelRoute: formatModelRoute(currentRecord.model),
			readiness: readinessInfo.readiness,
			...(readinessInfo.readinessReason && { readinessReason: readinessInfo.readinessReason }),
			...(readinessInfo.engineConfirmed !== undefined && { engineConfirmed: readinessInfo.engineConfirmed }),
			disagreement: readinessInfo.disagreement,
			...(engine?.lastReportAt && { lastReportAt: engine.lastReportAt.toISOString() }),
			reportStale: readinessInfo.reportStale,
			createdAt: agent.createdAt.toISOString(),
		},
	};
}

async function evaluateAgentBotAndRoomsIntegrity(
	agent: Pick<IAiAgent, 'headVersion' | 'status'>,
	seat: IAiSeat | undefined,
	roomIds: readonly string[],
): Promise<{ botInvalid: boolean; roomInvalid: boolean }> {
	if (!seat || seat.state === 'retired' || agent.status === 'disabled') {
		return { botInvalid: false, roomInvalid: false };
	}

	const bot = await Users.findOneById(seat.botUserId, {
		projection: { _id: 1, type: 1, roles: 1, active: 1, inactiveReason: 1, aiAgents: 1, services: 1 },
	});
	const mustBeActive = agent.headVersion !== undefined || bot?.aiAgents?.activatedAt !== undefined;
	const botInvalid = !bot || !isReservedAgentBotValid(bot, seat.engineId) || (mustBeActive && bot.active !== true);

	if (botInvalid) {
		return { botInvalid: true, roomInvalid: false };
	}

	const roomsToCheck = roomIds.length > 0 ? roomIds : seat.allowedRoomIds;
	for (const roomId of roomsToCheck) {
		const room = await Rooms.findOneById(roomId);
		if (!room || !isOrdinaryPublicChannel(room)) {
			return { botInvalid: false, roomInvalid: true };
		}
		const banned = await Subscriptions.findOneBannedSubscription(roomId, seat.botUserId);
		if (banned) {
			return { botInvalid: false, roomInvalid: true };
		}
		if (agent.headVersion !== undefined) {
			const sub = await Subscriptions.findOneByRoomIdAndUserId(roomId, seat.botUserId, { projection: { _id: 1 } });
			if (!sub) {
				return { botInvalid: false, roomInvalid: true };
			}
		}
	}

	return { botInvalid: false, roomInvalid: false };
}

async function resolveEligibleRoomsForActor(roomIds: string[], actorUser: IUser): Promise<AiAgentRoomOption[]> {
	const options: AiAgentRoomOption[] = [];
	const uniqueIds = [...new Set(roomIds)];
	for (const roomId of uniqueIds) {
		const room = await Rooms.findOneById(roomId);
		if (!room || !isOrdinaryPublicChannel(room)) {
			continue;
		}
		const canAccess = await Authorization.canAccessRoom(room, actorUser);
		if (!canAccess) {
			continue;
		}
		try {
			await assertCanAddUsersToRoom(actorUser._id, room);
		} catch {
			continue;
		}
		options.push({
			_id: room._id,
			name: room.name ?? room._id,
			...(room.fname && { fname: room.fname }),
		});
	}
	return options.sort((a, b) => a.name.localeCompare(b.name));
}

async function buildEngineSeatCounts(
	engine: Pick<IAiEngine, '_id' | 'name' | 'observed' | 'lastReportAt'>,
	engineSeats: IAiSeat[],
	agentBySeatId: ReadonlyMap<string, unknown>,
	actorUser: IUser,
	nowMs: number,
): Promise<AiEngineSeatCounts> {
	const reportStale = !isEngineReportFresh(engine.lastReportAt, nowMs);

	let registered = 0;
	let available = 0;
	let claimed = 0;
	let retired = 0;
	let disagreed = 0;
	const allowedRoomPool: string[] = [];
	const allowedRoutePool = new Set<string>();
	const claimableSeats: IAiSeat[] = [];

	for (const seat of engineSeats) {
		const observed = engine.observed?.seats.find((entry) => entry.seatId === seat.seatId);
		if (doesObservationDisagreeWithSeat(seat, observed)) {
			disagreed += 1;
		}
		if (seat.state === 'registered') {
			registered += 1;
			if (!agentBySeatId.has(seat.seatId) && isSeatClaimableByObservation(seat, engine, nowMs)) {
				available += 1;
				claimableSeats.push(seat);
			}
			allowedRoomPool.push(...seat.allowedRoomIds);
			seat.allowedRouteIds.forEach((route) => allowedRoutePool.add(route));
		} else if (seat.state === 'claimed') {
			claimed += 1;
		} else if (seat.state === 'retired') {
			retired += 1;
		}
	}

	// Filter room picker strictly by actor visibility and invite permission so no private room metadata leaks.
	const eligibleRooms = await resolveEligibleRoomsForActor(allowedRoomPool, actorUser);

	// Offer only tools from seats this person could claim right now: free, confirmed by the engine, and with a channel
	// they can use. Create refuses a mix that no single one of those seats offers.
	const eligibleRoomIds = new Set(eligibleRooms.map((room) => room._id));
	const allowedToolPool = new Set<string>();
	for (const seat of claimableSeats) {
		if (seat.allowedRoomIds.some((roomId) => eligibleRoomIds.has(roomId))) {
			getEffectiveSeatTools(seat, engine.observed).forEach((tool) => allowedToolPool.add(tool));
		}
	}
	const allowedTools = [...allowedToolPool].sort();

	return {
		engineId: engine._id,
		engineName: engine.name,
		registered,
		available,
		claimed,
		retired,
		disagreed,
		...(engine.lastReportAt && { lastReportAt: engine.lastReportAt.toISOString() }),
		reportStale,
		allowedTools,
		toolOptions: toObservedToolOptions(allowedTools, engine.observed),
		allowedRoutes: [...allowedRoutePool].sort(),
		...(engine.observed?.catalogue.skillsCommit && { skillsCommit: engine.observed.catalogue.skillsCommit }),
		skills: [...(engine.observed?.catalogue.skills ?? [])].sort(),
		eligibleRooms,
	};
}

/**
 * An agent's tool options. Its own tools are always listed (the caller already sees them), marked withdrawn when its
 * seat no longer offers them. Further tools its seat offers are listed only when the caller can use one of the seat's
 * channels: the same room rule as the Create pool, so the list never reveals the tools of a seat the caller could not use.
 */
function toAgentToolOptions(
	seat: IAiSeat | undefined,
	observed: IAiEngine['observed'],
	tools: string[],
	usableRoomIds: ReadonlySet<string>,
): AiAgentToolOption[] {
	const seatTools = seat ? getEffectiveSeatTools(seat, observed) : [];
	const callerCanUseSeat = Boolean(seat?.allowedRoomIds.some((roomId) => usableRoomIds.has(roomId)));
	const offered = callerCanUseSeat ? seatTools : seatTools.filter((toolId) => tools.includes(toolId));
	return toObservedToolOptions(
		offered,
		observed,
		tools.filter((toolId) => !seatTools.includes(toolId)),
	);
}

export async function listAiAgentsForActor(
	actorUser: IUser,
	now: Date = new Date(),
): Promise<{ agents: AiAgentSummary[]; engines: AiEngineSeatCounts[] }> {
	const [engines, seats, agents] = await Promise.all([
		AiEngines.findAllSortedByName({ projection: { name: 1, observed: 1, lastReportAt: 1 } }).toArray(),
		AiSeats.findAllSortedBySeatId().toArray(),
		AiAgents.findAllSortedByCreatedAt().toArray(),
	]);

	const engineById = new Map(engines.map((engine) => [engine._id, engine]));
	const seatBySeatId = new Map(seats.map((seat) => [seat.seatId, seat]));
	const agentBySeatId = new Map(agents.map((agent) => [agent.seatId, agent]));
	const nowMs = now.getTime();

	// Channels of agents' seats this person can access and invite into, so tool options follow the caller's room access.
	const agentSeatRoomIds = agents.flatMap((agent) => seatBySeatId.get(agent.seatId)?.allowedRoomIds ?? []);
	const usableRoomIds = new Set((await resolveEligibleRoomsForActor(agentSeatRoomIds, actorUser)).map((room) => room._id));

	// List NEVER returns `instructions` — only metadata and readiness state.
	const agentSummaries: AiAgentSummary[] = [];
	for (const agent of agents) {
		const seat = seatBySeatId.get(agent.seatId);
		const engine = engineById.get(agent.engineId);
		let name: string | undefined;
		let rooms: string[] = [];
		let tools: string[] = [];
		let modelRoute: string | undefined;

		if (agent.headVersion !== undefined) {
			const revision = await AiAgentRevisions.findOneByAgentIdAndVersion(agent._id, agent.headVersion);
			const parsed = revision ? parseStoredRecord110(revision.bytes) : null;
			if (parsed) {
				name = parsed.name;
				rooms = [...parsed.chat.rooms];
				tools = [...parsed.tools];
				modelRoute = formatModelRoute(parsed.model);
			}
		}

		const integrity = await evaluateAgentBotAndRoomsIntegrity(agent, seat, rooms);
		const readinessInfo = deriveAgentReadiness(agent, seat, engine, nowMs, integrity);
		agentSummaries.push({
			_id: agent._id,
			engineId: agent.engineId,
			seatId: agent.seatId,
			seatState: seat?.state ?? 'claimed',
			...(agent.headVersion !== undefined && { headVersion: agent.headVersion }),
			...(agent.status !== undefined && { status: agent.status }),
			...(name !== undefined && { name }),
			rooms,
			tools,
			toolOptions: toAgentToolOptions(seat, engine?.observed, tools, usableRoomIds),
			...(modelRoute !== undefined && { modelRoute }),
			readiness: readinessInfo.readiness,
			...(readinessInfo.readinessReason && { readinessReason: readinessInfo.readinessReason }),
			...(readinessInfo.engineConfirmed !== undefined && { engineConfirmed: readinessInfo.engineConfirmed }),
			disagreement: readinessInfo.disagreement,
			...(engine?.lastReportAt && { lastReportAt: engine.lastReportAt.toISOString() }),
			reportStale: readinessInfo.reportStale,
			createdAt: agent.createdAt.toISOString(),
		});
	}

	const engineCounts: AiEngineSeatCounts[] = [];
	for (const engine of engines) {
		engineCounts.push(
			await buildEngineSeatCounts(
				engine,
				seats.filter((seat) => seat.engineId === engine._id),
				agentBySeatId,
				actorUser,
				nowMs,
			),
		);
	}

	return { agents: agentSummaries, engines: engineCounts };
}

export async function getAiAgentInfo(agentId: string, now: Date = new Date()): Promise<AiAgentDetails> {
	const agent = await AiAgents.findOneById(agentId);
	if (!agent) {
		throw new AiAgentActionError('error-ai-agent-not-found', 'Agent not found', 404);
	}

	const [seat, engine, revision] = await Promise.all([
		AiSeats.findOneBySeatId(agent.seatId),
		AiEngines.findOneById(agent.engineId, { projection: { observed: 1, lastReportAt: 1 } }),
		agent.headVersion !== undefined ? AiAgentRevisions.findOneByAgentIdAndVersion(agent._id, agent.headVersion) : Promise.resolve(null),
	]);

	const parsed = revision ? parseStoredRecord110(revision.bytes) : null;
	const integrity = await evaluateAgentBotAndRoomsIntegrity(agent, seat ?? undefined, parsed?.chat.rooms ?? []);
	const readinessInfo = deriveAgentReadiness(agent, seat ?? undefined, engine ?? undefined, now.getTime(), integrity);

	return {
		_id: agent._id,
		engineId: agent.engineId,
		seatId: agent.seatId,
		seatState: seat?.state ?? 'claimed',
		claim: agent.claim,
		...(agent.headVersion !== undefined && { headVersion: agent.headVersion }),
		...(agent.status !== undefined && { status: agent.status }),
		...(parsed && {
			name: parsed.name,
			instructions: parsed.instructions,
			skills: parsed.skills,
			memory: parsed.memory,
			limits: {
				perPersonHour: parsed.limits.perPersonHour,
				perPersonDay: parsed.limits.perPersonDay,
				dailySpendUsd: parsed.limits.dailySpendUsd,
			},
			updatedAt: parsed.updatedAt,
		}),
		rooms: parsed ? [...parsed.chat.rooms] : [],
		tools: parsed ? [...parsed.tools] : [],
		...(parsed && { modelRoute: formatModelRoute(parsed.model) }),
		readiness: readinessInfo.readiness,
		...(readinessInfo.readinessReason && { readinessReason: readinessInfo.readinessReason }),
		...(readinessInfo.engineConfirmed !== undefined && { engineConfirmed: readinessInfo.engineConfirmed }),
		disagreement: readinessInfo.disagreement,
		...(engine?.lastReportAt && { lastReportAt: engine.lastReportAt.toISOString() }),
		reportStale: readinessInfo.reportStale,
		createdAt: agent.createdAt.toISOString(),
	};
}
