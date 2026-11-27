import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import type { LicenseModule } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { AiAgentRevisions, AiAgents, AiEngines, AiSeats } from '@rocket.chat/models';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';

import type { AiEngineVariables } from './aiAgentsEngineAuth';
import { aiEngineAuthentication } from './aiAgentsEngineAuth';
import {
	BodyTooLargeError,
	createAiEngineRateLimiter,
	ENGINE_READ_RATE_LIMIT,
	ENGINE_REPORT_RATE_LIMIT,
	MAX_ENGINE_REPORT_BODY_BYTES,
	readBoundedBodyBuffer,
} from './aiAgentsGuards';
import { buildSeatEnvelope110, revisionBytesToUtf8, validateEngineReport } from '../../lib/ai-agents/recordContract';
import { SEAT_ID_PATTERN, UUID_PATTERN } from '../../lib/ai-agents/textValidation';

const logger = new Logger('AiAgentsEngineRoutes');

const POSITIVE_INT_PATTERN = /^[1-9][0-9]*$/;
const NO_STORE = { 'Cache-Control': 'no-store' };
const MAJORITY_READ = { readConcern: { level: 'majority' as const } };

export const aiEngineRateLimiter = createAiEngineRateLimiter();

type AiLicenseChecker = { hasModule: (module: LicenseModule) => boolean };

function requireAiLicense(licenseManager: AiLicenseChecker): MiddlewareHandler {
	return async (c, next) => {
		if (!licenseManager.hasModule(AI_LICENSE_MODULE)) {
			return c.json(
				{
					success: false,
					error: 'This is an enterprise feature [error-action-not-allowed]',
					errorType: 'error-action-not-allowed',
				},
				400,
				NO_STORE,
			);
		}
		return next();
	};
}

/**
 * Builds the bearer-authenticated Hono router for engine-facing Step 3 routes:
 * - `GET /ai-agents.engine.head`
 * - `GET /ai-agents.engine.version`
 * - `POST /ai-agents.engine.report`
 */
export function createAiAgentsEngineHonoApp(rateLimiter = aiEngineRateLimiter, licenseManager: AiLicenseChecker = License) {
	const app = new Hono<{ Variables: AiEngineVariables & { remoteAddress?: string } }>();
	const aiLicenseGuard = requireAiLicense(licenseManager);

	app.get(
		'/ai-agents.engine.head',
		aiEngineAuthentication,
		aiLicenseGuard,
		rateLimiter.middleware('engine.head', ENGINE_READ_RATE_LIMIT),
		async (c) => {
			const engineId = c.get('aiEngineId');
			const seatId = c.req.query('seat') ?? '';
			const requestId = c.req.header('x-request-id') ?? '';

			if (!SEAT_ID_PATTERN.test(seatId) || !UUID_PATTERN.test(requestId)) {
				return c.json({ success: false, error: 'invalid-params' }, 400, NO_STORE);
			}

			const seat = await AiSeats.findOneByEngineIdAndSeatId(engineId, seatId, MAJORITY_READ);
			if (!seat) {
				return c.json({ success: false, error: 'seat-not-found' }, 404, NO_STORE);
			}

			const agent = await AiAgents.findOneBySeatId(seatId, MAJORITY_READ);
			if (!agent || agent.engineId !== engineId || agent.headVersion === undefined) {
				return c.json(
					buildSeatEnvelope110({
						requestId,
						engineId,
						seatId,
						seatState: seat.state,
						kind: 'head',
						headVersion: 0,
						version: 0,
						digest: null,
					}),
					200,
					NO_STORE,
				);
			}

			const revision = await AiAgentRevisions.findOneByAgentIdAndVersion(agent._id, agent.headVersion, MAJORITY_READ);
			if (!revision) {
				// 200 with `bytes` omitted signals `head-body-unavailable` while still delivering `headVersion`.
				return c.json(
					buildSeatEnvelope110({
						requestId,
						engineId,
						seatId,
						seatState: seat.state,
						kind: 'head',
						headVersion: agent.headVersion,
						version: agent.headVersion,
						digest: null,
					}),
					200,
					NO_STORE,
				);
			}

			return c.json(
				buildSeatEnvelope110({
					requestId,
					engineId,
					seatId,
					seatState: seat.state,
					kind: 'head',
					headVersion: agent.headVersion,
					version: revision.version,
					digest: revision.digest,
					bytes: revisionBytesToUtf8(revision.bytes),
				}),
				200,
				NO_STORE,
			);
		},
	);

	app.get(
		'/ai-agents.engine.version',
		aiEngineAuthentication,
		aiLicenseGuard,
		rateLimiter.middleware('engine.version', ENGINE_READ_RATE_LIMIT),
		async (c) => {
			const engineId = c.get('aiEngineId');
			const seatId = c.req.query('seat') ?? '';
			const versionRaw = c.req.query('version') ?? '';
			const requestId = c.req.header('x-request-id') ?? '';

			if (!SEAT_ID_PATTERN.test(seatId) || !POSITIVE_INT_PATTERN.test(versionRaw) || !UUID_PATTERN.test(requestId)) {
				return c.json({ success: false, error: 'invalid-params' }, 400, NO_STORE);
			}

			const requestedVersion = Number(versionRaw);
			if (!Number.isSafeInteger(requestedVersion) || requestedVersion < 1) {
				return c.json({ success: false, error: 'invalid-params' }, 400, NO_STORE);
			}

			const seat = await AiSeats.findOneByEngineIdAndSeatId(engineId, seatId, MAJORITY_READ);
			if (!seat) {
				return c.json({ success: false, error: 'seat-not-found' }, 404, NO_STORE);
			}

			const agent = await AiAgents.findOneBySeatId(seatId, MAJORITY_READ);
			if (!agent || agent.engineId !== engineId || agent.headVersion === undefined || requestedVersion > agent.headVersion) {
				return c.json({ success: false, error: 'version-unavailable' }, 404, NO_STORE);
			}

			const revision = await AiAgentRevisions.findOneByAgentIdAndVersion(agent._id, requestedVersion, MAJORITY_READ);
			if (!revision) {
				return c.json({ success: false, error: 'version-unavailable' }, 404, NO_STORE);
			}

			return c.json(
				buildSeatEnvelope110({
					requestId,
					engineId,
					seatId,
					seatState: seat.state,
					kind: 'version',
					headVersion: agent.headVersion,
					version: revision.version,
					digest: revision.digest,
					bytes: revisionBytesToUtf8(revision.bytes),
				}),
				200,
				NO_STORE,
			);
		},
	);

	app.post(
		'/ai-agents.engine.report',
		aiEngineAuthentication,
		aiLicenseGuard,
		rateLimiter.middleware('engine.report', ENGINE_REPORT_RATE_LIMIT),
		async (c) => {
			const engineId = c.get('aiEngineId');

			let rawBuf: Buffer;
			try {
				rawBuf = await readBoundedBodyBuffer(c.req.raw, MAX_ENGINE_REPORT_BODY_BYTES);
			} catch (error) {
				if (error instanceof BodyTooLargeError) {
					return c.json({ success: false, error: 'Payload too large', errorType: 'error-payload-too-large' }, 413, NO_STORE);
				}
				throw error;
			}

			let parsed: unknown;
			try {
				parsed = JSON.parse(rawBuf.toString('utf8'));
			} catch {
				return c.json({ success: false, error: 'report-malformed' }, 400, NO_STORE);
			}

			const validated = validateEngineReport(parsed, engineId);
			if (!validated.ok) {
				const status = validated.error === 'engine-id-mismatch' ? 403 : 400;
				return c.json({ success: false, error: validated.error }, status, NO_STORE);
			}

			const registeredSeats = await AiSeats.findByEngineId(engineId).toArray();
			const registeredSeatIds = new Set(registeredSeats.map((seat) => seat.seatId));

			// Reports never create or authorize seats: ignore unregistered seats and log by id only.
			const acceptedSeats = [];
			for (const entry of validated.report.seats) {
				if (!registeredSeatIds.has(entry.seatId)) {
					logger.warn({ msg: 'Ignoring engine report entry for unregistered seat', engineId, seatId: entry.seatId });
					continue;
				}
				acceptedSeats.push(entry);
			}

			const now = new Date();
			await AiEngines.updateObservedReport(
				engineId,
				{
					...validated.report,
					seats: acceptedSeats,
				},
				now,
			);

			const agents = await AiAgents.findByEngineId(engineId, { projection: { seatId: 1, headVersion: 1 } }).toArray();
			const headBySeatId = new Map(agents.map((agent) => [agent.seatId, agent.headVersion ?? 0]));
			const heads = registeredSeats.map((seat) => ({
				seatId: seat.seatId,
				seatState: seat.state,
				headVersion: headBySeatId.get(seat.seatId) ?? 0,
			}));

			return c.json({ success: true, heads }, 200, NO_STORE);
		},
	);

	return app;
}
