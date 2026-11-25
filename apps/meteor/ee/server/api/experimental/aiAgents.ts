import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import type { IAiEngine, LicenseModule } from '@rocket.chat/core-typings';
import { AiEngines } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type {
	AiAgentDetails,
	AiAgentSummary,
	AiEngineNewCredential,
	AiEngineSeatCounts,
	AiEngineSummary,
	AiReservedBotSummary,
	AiSeatSummary,
} from '@rocket.chat/rest-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { createAiAgentsEngineHonoApp } from './aiAgentsEngineRoutes';
import { createAiAgentsBodyLimitMiddleware, MANAGEMENT_WRITE_RATE_LIMIT } from './aiAgentsGuards';
import { API } from '../../../../server/api/api';
import { settings } from '../../../../server/settings/cached';
import {
	AiAgentActionError,
	createAiAgent,
	disableAiAgent,
	getAiAgentInfo,
	listAiAgentsForActor,
	registerSeatForEngine,
	retireSeatById,
	retryAiAgent,
} from '../../lib/ai-agents/agentLifecycle';
import { buildAuditUserActor, recordAiAgentAuditEvent } from '../../lib/ai-agents/audit';
import { MANAGE_AI_AGENTS_PERMISSION } from '../../lib/ai-agents/constants';
import { createEngineCredential, MAX_ACTIVE_ENGINE_CREDENTIALS } from '../../lib/ai-agents/engineCredentials';
import { reserveAgentBots } from '../../lib/ai-agents/identity';

const engineSummarySchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		createdAt: { type: 'string' },
		lastReportAt: { type: 'string' },
		credentials: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					createdAt: { type: 'string' },
					expiresAt: { type: 'string' },
					revokedAt: { type: 'string' },
				},
				required: ['id', 'createdAt', 'expiresAt'],
				additionalProperties: false,
			},
		},
	},
	required: ['_id', 'name', 'createdAt', 'credentials'],
	additionalProperties: false,
} as const;

const seatSummarySchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		engineId: { type: 'string' },
		seatId: { type: 'string' },
		botUserId: { type: 'string' },
		allowedRoomIds: { type: 'array', items: { type: 'string' } },
		allowedToolIds: { type: 'array', items: { type: 'string' } },
		allowedRouteIds: { type: 'array', items: { type: 'string' } },
		state: { type: 'string', enum: ['registered', 'claimed', 'retired'] },
		registeredAt: { type: 'string' },
		agentId: { type: 'string' },
		claimedAt: { type: 'string' },
		retiredAt: { type: 'string' },
	},
	required: ['_id', 'engineId', 'seatId', 'botUserId', 'allowedRoomIds', 'allowedToolIds', 'allowedRouteIds', 'state', 'registeredAt'],
	additionalProperties: false,
} as const;

const agentSummarySchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		engineId: { type: 'string' },
		seatId: { type: 'string' },
		seatState: { type: 'string', enum: ['registered', 'claimed', 'retired'] },
		headVersion: { type: 'number' },
		status: { type: 'string', enum: ['draft', 'published', 'disabled'] },
		name: { type: 'string' },
		rooms: { type: 'array', items: { type: 'string' } },
		tools: { type: 'array', items: { type: 'string' } },
		modelRoute: { type: 'string' },
		readiness: {
			type: 'string',
			enum: [
				'incomplete',
				'published, waiting for engine',
				'engine ready, app not proved',
				'ready',
				'disabled',
				'retired',
				'bot-invalid',
				'room-invalid',
			],
		},
		readinessReason: { type: 'string' },
		engineConfirmed: { type: 'boolean' },
		disagreement: { type: 'boolean' },
		lastReportAt: { type: 'string' },
		reportStale: { type: 'boolean' },
		createdAt: { type: 'string' },
	},
	required: ['_id', 'engineId', 'seatId', 'seatState', 'rooms', 'tools', 'readiness', 'reportStale', 'createdAt'],
	additionalProperties: false,
} as const;

const agentDetailsSchema = {
	type: 'object',
	properties: {
		...agentSummarySchema.properties,
		claim: { type: 'string' },
		instructions: { type: 'string' },
		skills: {
			type: 'object',
			properties: {
				commit: { type: 'string' },
				ids: { type: 'array', items: { type: 'string' } },
			},
			required: ['commit', 'ids'],
			additionalProperties: false,
		},
		memory: {
			type: 'object',
			properties: { retentionDays: { type: 'number' } },
			required: ['retentionDays'],
			additionalProperties: false,
		},
		limits: {
			type: 'object',
			properties: {
				perPersonHour: { type: 'number' },
				perPersonDay: { type: 'number' },
				dailySpendUsd: { type: 'number' },
			},
			required: ['perPersonHour', 'perPersonDay', 'dailySpendUsd'],
			additionalProperties: false,
		},
		updatedAt: { type: 'string' },
	},
	required: [...agentSummarySchema.required, 'claim'],
	additionalProperties: false,
} as const;

const engineSeatCountsSchema = {
	type: 'object',
	properties: {
		engineId: { type: 'string' },
		engineName: { type: 'string' },
		registered: { type: 'number' },
		available: { type: 'number' },
		claimed: { type: 'number' },
		retired: { type: 'number' },
		disagreed: { type: 'number' },
		lastReportAt: { type: 'string' },
		reportStale: { type: 'boolean' },
		allowedTools: { type: 'array', items: { type: 'string' } },
		allowedRoutes: { type: 'array', items: { type: 'string' } },
		skillsCommit: { type: 'string' },
		skills: { type: 'array', items: { type: 'string' } },
		eligibleRooms: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					name: { type: 'string' },
					fname: { type: 'string' },
				},
				required: ['_id', 'name'],
				additionalProperties: false,
			},
		},
	},
	required: [
		'engineId',
		'engineName',
		'registered',
		'available',
		'claimed',
		'retired',
		'disagreed',
		'reportStale',
		'allowedTools',
		'allowedRoutes',
		'skills',
		'eligibleRooms',
	],
	additionalProperties: false,
} as const;

const errorResponses = {
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
	404: validateNotFoundErrorResponse,
};

/** Every AI agents route a person calls: a signed-in user holding the permission, on a workspace with the AI add-on */
export const aiAgentsRouteOptions = {
	authRequired: true as const,
	permissionsRequired: [MANAGE_AI_AGENTS_PERMISSION],
	license: [AI_LICENSE_MODULE] satisfies LicenseModule[],
};

/** Engine links, credentials, reserved bots, and seat registry mutations take the privileged settings permission too */
export const aiEngineAdminRouteOptions = {
	...aiAgentsRouteOptions,
	permissionsRequired: [MANAGE_AI_AGENTS_PERMISSION, 'edit-privileged-setting'],
};

const aiAgentsWriteRouteOptions = {
	...aiAgentsRouteOptions,
	rateLimiterOptions: MANAGEMENT_WRITE_RATE_LIMIT,
};

const aiEngineAdminWriteRouteOptions = {
	...aiEngineAdminRouteOptions,
	rateLimiterOptions: MANAGEMENT_WRITE_RATE_LIMIT,
};

// Mount pre-parse body size enforcement (128 KiB management, 256 KiB engine.report) and bearer engine routes
// on the underlying Hono router when available (tests mocking API.experimental may omit `router`).
if (API.experimental.router?.getHonoRouter) {
	const hono = API.experimental.router.getHonoRouter();
	hono.use('/ai-agents.*', createAiAgentsBodyLimitMiddleware());
	hono.route('/', createAiAgentsEngineHonoApp());
}

const toEngineSummary = ({
	_id,
	name,
	createdAt,
	credentials,
	lastReportAt,
}: Pick<IAiEngine, '_id' | 'name' | 'createdAt' | 'credentials' | 'lastReportAt'>) =>
	({
		_id,
		name,
		createdAt,
		...(lastReportAt && { lastReportAt }),
		credentials: credentials.map(({ id, createdAt, expiresAt, revokedAt }) => ({
			id,
			createdAt,
			expiresAt,
			...(revokedAt && { revokedAt }),
		})),
	}) as unknown as AiEngineSummary;

const isAiAgentsEnabled = () => settings.get<boolean>('AI_Agents_Enabled') === true;

const mapActionError = (error: unknown) => {
	if (error instanceof AiAgentActionError) {
		if (error.statusCode === 403 && typeof API.experimental.forbidden === 'function') {
			return API.experimental.forbidden(error.message);
		}
		return API.experimental.failure<string, string, string, undefined>(error.message, error.errorType);
	}
	throw error;
};

API.experimental.get(
	'ai-agents.engines',
	{
		...aiAgentsRouteOptions,
		response: {
			200: ajv.compile<{ engines: AiEngineSummary[] }>({
				type: 'object',
				properties: {
					engines: { type: 'array', items: engineSummarySchema },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['engines', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		const engines = await AiEngines.findAllSortedByName({
			projection: { name: 1, createdAt: 1, credentials: 1, lastReportAt: 1 },
		}).toArray();

		return API.experimental.success({ engines: engines.map(toEngineSummary) });
	},
);

const NO_STORE = { 'Cache-Control': 'no-store' };

const newCredentialSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		token: { type: 'string' },
		expiresAt: { type: 'string' },
	},
	required: ['id', 'token', 'expiresAt'],
	additionalProperties: false,
} as const;

const credentialDays = () => settings.get<number>('AI_Agents_Engine_Credential_Days') || 90;

const toNewCredential = (id: string, token: string, expiresAt: Date) => ({ id, token, expiresAt }) as unknown as AiEngineNewCredential;

API.experimental.post(
	'ai-agents.engines.link',
	{
		...aiEngineAdminWriteRouteOptions,
		body: ajv.compile<{ name: string }>({
			type: 'object',
			properties: { name: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[^\\u0000-\\u001f\\u007f]+$' } },
			required: ['name'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ engine: AiEngineSummary; credential: AiEngineNewCredential }>({
				type: 'object',
				properties: {
					engine: engineSummarySchema,
					credential: newCredentialSchema,
					success: { type: 'boolean', enum: [true] },
				},
				required: ['engine', 'credential', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		const now = new Date();
		const { credential, token } = createEngineCredential(now, credentialDays());
		const engine = { _id: Random.id(), name: this.bodyParams.name, credentials: [credential], createdBy: this.userId, createdAt: now };

		await AiEngines.insertOne(engine);
		await recordAiAgentAuditEvent({ action: 'engine.link', engineId: engine._id, credentialId: credential.id }, buildAuditUserActor(this));

		return {
			...API.experimental.success({
				engine: toEngineSummary(engine),
				credential: toNewCredential(credential.id, token, credential.expiresAt),
			}),
			headers: NO_STORE,
		};
	},
);

API.experimental.post(
	'ai-agents.engines.rotateCredential',
	{
		...aiEngineAdminWriteRouteOptions,
		body: ajv.compile<{ engineId: string }>({
			type: 'object',
			properties: { engineId: { type: 'string', minLength: 1, maxLength: 64 } },
			required: ['engineId'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ credential: AiEngineNewCredential }>({
				type: 'object',
				properties: {
					credential: newCredentialSchema,
					success: { type: 'boolean', enum: [true] },
				},
				required: ['credential', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		const now = new Date();
		const { credential, token } = createEngineCredential(now, credentialDays());

		const { modifiedCount } = await AiEngines.addCredentialWhileFewerActive(this.bodyParams.engineId, credential, {
			maxActive: MAX_ACTIVE_ENGINE_CREDENTIALS,
			now,
		});
		if (!modifiedCount) {
			return API.experimental.failure(
				'No such engine, or it already has the most active credentials allowed',
				'error-ai-engine-credential-not-added',
			);
		}

		await recordAiAgentAuditEvent(
			{ action: 'engine.rotate-credential', engineId: this.bodyParams.engineId, credentialId: credential.id },
			buildAuditUserActor(this),
		);

		return {
			...API.experimental.success({ credential: toNewCredential(credential.id, token, credential.expiresAt) }),
			headers: NO_STORE,
		};
	},
);

API.experimental.post(
	'ai-agents.engines.revokeCredential',
	{
		...aiEngineAdminWriteRouteOptions,
		body: ajv.compile<{ engineId: string; credentialId: string }>({
			type: 'object',
			properties: {
				engineId: { type: 'string', minLength: 1, maxLength: 64 },
				credentialId: { type: 'string', minLength: 1, maxLength: 64 },
			},
			required: ['engineId', 'credentialId'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [true] } },
				required: ['success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		const { modifiedCount } = await AiEngines.revokeCredentialById(this.bodyParams.engineId, this.bodyParams.credentialId, new Date());
		if (!modifiedCount) {
			return API.experimental.failure('No such active credential for this engine', 'error-ai-engine-credential-not-found');
		}

		await recordAiAgentAuditEvent(
			{ action: 'engine.revoke-credential', engineId: this.bodyParams.engineId, credentialId: this.bodyParams.credentialId },
			buildAuditUserActor(this),
		);

		return API.experimental.success();
	},
);

API.experimental.post(
	'ai-agents.engines.reserveBots',
	{
		...aiEngineAdminWriteRouteOptions,
		body: ajv.compile<{ engineId: string; count: number }>({
			type: 'object',
			properties: {
				engineId: { type: 'string', minLength: 1, maxLength: 64 },
				count: { type: 'integer', minimum: 1, maximum: 20 },
			},
			required: ['engineId', 'count'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ bots: AiReservedBotSummary[] }>({
				type: 'object',
				properties: {
					bots: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string' },
								username: { type: 'string' },
							},
							required: ['_id', 'username'],
							additionalProperties: false,
						},
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['bots', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		const engine = await AiEngines.findOneById(this.bodyParams.engineId, { projection: { _id: 1 } });
		if (!engine) {
			return API.experimental.failure('No such engine', 'error-ai-engine-not-found');
		}

		const bots = await reserveAgentBots(this.bodyParams.engineId, this.bodyParams.count);
		await recordAiAgentAuditEvent(
			{
				action: 'engine.reserve-bots',
				engineId: this.bodyParams.engineId,
				botUserIds: bots.map((bot) => bot._id),
			},
			buildAuditUserActor(this),
		);

		return API.experimental.success({ bots });
	},
);

API.experimental.post(
	'ai-agents.seats.register',
	{
		...aiEngineAdminWriteRouteOptions,
		body: ajv.compile<{
			engineId: string;
			seatId: string;
			botUserId: string;
			allowedRoomIds: string[];
			allowedToolIds: string[];
			allowedRouteIds: string[];
		}>({
			type: 'object',
			properties: {
				engineId: { type: 'string', minLength: 1, maxLength: 64 },
				seatId: { type: 'string', minLength: 1, maxLength: 64 },
				botUserId: { type: 'string', minLength: 1, maxLength: 128 },
				allowedRoomIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 },
				allowedToolIds: { type: 'array', items: { type: 'string' }, maxItems: 32 },
				allowedRouteIds: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 32 },
			},
			required: ['engineId', 'seatId', 'botUserId', 'allowedRoomIds', 'allowedToolIds', 'allowedRouteIds'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ seat: AiSeatSummary }>({
				type: 'object',
				properties: {
					seat: seatSummarySchema,
					success: { type: 'boolean', enum: [true] },
				},
				required: ['seat', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		try {
			const seat = await registerSeatForEngine(this.bodyParams, {
				userId: this.userId,
				auditActor: buildAuditUserActor(this),
			});
			return API.experimental.success({ seat });
		} catch (error) {
			return mapActionError(error);
		}
	},
);

API.experimental.post(
	'ai-agents.seats.retire',
	{
		...aiEngineAdminWriteRouteOptions,
		body: ajv.compile<{ seatId: string }>({
			type: 'object',
			properties: {
				seatId: { type: 'string', minLength: 1, maxLength: 64 },
			},
			required: ['seatId'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [true] } },
				required: ['success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		try {
			await retireSeatById(this.bodyParams.seatId, {
				userId: this.userId,
				auditActor: buildAuditUserActor(this),
			});
			return API.experimental.success();
		} catch (error) {
			return mapActionError(error);
		}
	},
);

API.experimental.get(
	'ai-agents.list',
	{
		...aiAgentsRouteOptions,
		response: {
			200: ajv.compile<{ agents: AiAgentSummary[]; engines: AiEngineSeatCounts[] }>({
				type: 'object',
				properties: {
					agents: { type: 'array', items: agentSummarySchema },
					engines: { type: 'array', items: engineSeatCountsSchema },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['agents', 'engines', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		if (!isAiAgentsEnabled()) {
			return API.experimental.failure('AI agents are disabled on this workspace', 'error-ai-agents-disabled');
		}
		const result = await listAiAgentsForActor(this.user);
		return API.experimental.success(result);
	},
);

API.experimental.get(
	'ai-agents.info',
	{
		...aiAgentsRouteOptions,
		query: ajv.compile<{ agentId: string }>({
			type: 'object',
			properties: {
				agentId: { type: 'string', minLength: 1, maxLength: 128 },
			},
			required: ['agentId'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ agent: AiAgentDetails }>({
				type: 'object',
				properties: {
					agent: agentDetailsSchema,
					success: { type: 'boolean', enum: [true] },
				},
				required: ['agent', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		if (!isAiAgentsEnabled()) {
			return API.experimental.failure('AI agents are disabled on this workspace', 'error-ai-agents-disabled');
		}
		try {
			const agent = await getAiAgentInfo(this.queryParams.agentId);
			return API.experimental.success({ agent });
		} catch (error) {
			return mapActionError(error);
		}
	},
);

API.experimental.post(
	'ai-agents.create',
	{
		...aiAgentsWriteRouteOptions,
		body: ajv.compile<{
			engineId: string;
			name: string;
			instructions: string;
			rooms: string[];
			tools: string[];
			modelRoute: string;
			skills?: string[];
		}>({
			type: 'object',
			properties: {
				engineId: { type: 'string', minLength: 1, maxLength: 64 },
				name: { type: 'string', minLength: 1 },
				instructions: { type: 'string', minLength: 1 },
				rooms: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 },
				tools: { type: 'array', items: { type: 'string' }, maxItems: 32 },
				modelRoute: { type: 'string', minLength: 1, maxLength: 128 },
				skills: { type: 'array', items: { type: 'string' }, maxItems: 32 },
			},
			required: ['engineId', 'name', 'instructions', 'rooms', 'tools', 'modelRoute'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ agent: AiAgentSummary; version: number }>({
				type: 'object',
				properties: {
					agent: agentSummarySchema,
					version: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['agent', 'version', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		if (!isAiAgentsEnabled()) {
			return API.experimental.failure('AI agents are disabled on this workspace', 'error-ai-agents-disabled');
		}
		try {
			const result = await createAiAgent(this.bodyParams, {
				user: this.user,
				auditActor: buildAuditUserActor(this),
			});
			return API.experimental.success(result);
		} catch (error) {
			return mapActionError(error);
		}
	},
);

API.experimental.post(
	'ai-agents.retry',
	{
		...aiAgentsWriteRouteOptions,
		body: ajv.compile<{
			agentId: string;
			name: string;
			instructions: string;
			rooms: string[];
			tools: string[];
			modelRoute: string;
			skills?: string[];
		}>({
			type: 'object',
			properties: {
				agentId: { type: 'string', minLength: 1, maxLength: 128 },
				name: { type: 'string', minLength: 1 },
				instructions: { type: 'string', minLength: 1 },
				rooms: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20 },
				tools: { type: 'array', items: { type: 'string' }, maxItems: 32 },
				modelRoute: { type: 'string', minLength: 1, maxLength: 128 },
				skills: { type: 'array', items: { type: 'string' }, maxItems: 32 },
			},
			required: ['agentId', 'name', 'instructions', 'rooms', 'tools', 'modelRoute'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ agent: AiAgentSummary; version: number }>({
				type: 'object',
				properties: {
					agent: agentSummarySchema,
					version: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['agent', 'version', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		if (!isAiAgentsEnabled()) {
			return API.experimental.failure('AI agents are disabled on this workspace', 'error-ai-agents-disabled');
		}
		try {
			const result = await retryAiAgent(this.bodyParams, {
				user: this.user,
				auditActor: buildAuditUserActor(this),
			});
			return API.experimental.success(result);
		} catch (error) {
			return mapActionError(error);
		}
	},
);

API.experimental.post(
	'ai-agents.disable',
	{
		...aiAgentsWriteRouteOptions,
		body: ajv.compile<{ agentId: string }>({
			type: 'object',
			properties: {
				agentId: { type: 'string', minLength: 1, maxLength: 128 },
			},
			required: ['agentId'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{ agent: AiAgentSummary; version: number }>({
				type: 'object',
				properties: {
					agent: agentSummarySchema,
					version: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['agent', 'version', 'success'],
				additionalProperties: false,
			}),
			...errorResponses,
		},
	},
	async function action() {
		if (!isAiAgentsEnabled()) {
			return API.experimental.failure('AI agents are disabled on this workspace', 'error-ai-agents-disabled');
		}
		try {
			const result = await disableAiAgent(this.bodyParams.agentId, {
				userId: this.userId,
				auditActor: buildAuditUserActor(this),
			});
			return API.experimental.success(result);
		} catch (error) {
			return mapActionError(error);
		}
	},
);
