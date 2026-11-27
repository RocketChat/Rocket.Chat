import { mockModel } from '@rocket.chat/models/testing';
import { Hono } from 'hono';

import { createAiAgentsEngineHonoApp } from './aiAgentsEngineRoutes';
import {
	createAiAgentsBodyLimitMiddleware,
	createAiEngineRateLimiter,
	MAX_ENGINE_REPORT_BODY_BYTES,
	MAX_MANAGEMENT_BODY_BYTES,
} from './aiAgentsGuards';
import { createEngineCredential } from '../../lib/ai-agents/engineCredentials';
import { buildAgentRecord110 } from '../../lib/ai-agents/recordContract';

const REQUEST_UUID = '11111111-2222-4333-8444-555555555555';

function makeStreamWithoutContentLength(payload: string, chunkSize = 16 * 1024): ReadableStream<Uint8Array> {
	const bytes = new TextEncoder().encode(payload);
	let offset = 0;
	return new ReadableStream({
		pull(controller) {
			if (offset >= bytes.byteLength) {
				controller.close();
				return;
			}
			const end = Math.min(offset + chunkSize, bytes.byteLength);
			controller.enqueue(bytes.subarray(offset, end));
			offset = end;
		},
	});
}

describe('Engine bearer routes & R08 guards (head, version, report, rate limits, pre-parse body limits)', () => {
	const now = new Date('2026-11-25T00:00:00.000Z');
	const { credential, token } = createEngineCredential(now, 30);

	const aiEngines = {
		findOneByCredentialId: jest.fn(),
		updateObservedReport: jest.fn(),
	};
	const aiSeats = {
		findOneByEngineIdAndSeatId: jest.fn(),
		findByEngineId: jest.fn(),
	};
	const aiAgents = {
		findOneBySeatId: jest.fn(),
		findByEngineId: jest.fn(),
	};
	const aiAgentRevisions = {
		findOneByAgentIdAndVersion: jest.fn(),
	};

	const engineDoc = {
		_id: 'eng-1',
		name: 'QA engine',
		credentials: [credential],
		createdBy: 'admin-1',
		createdAt: now,
	};

	const licensed = { hasModule: (module: string) => module === 'chat.rocket.rc-ai' };
	const unlicensed = { hasModule: () => false };

	beforeAll(() => {
		mockModel('AiEngines', aiEngines);
		mockModel('AiSeats', aiSeats);
		mockModel('AiAgents', aiAgents);
		mockModel('AiAgentRevisions', aiAgentRevisions);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		aiEngines.findOneByCredentialId.mockResolvedValue(engineDoc);
		aiEngines.updateObservedReport.mockResolvedValue({ modifiedCount: 1 });
	});

	it('refuses head, version, and report with 400 error-action-not-allowed when the AI add-on license is absent', async () => {
		const app = createAiAgentsEngineHonoApp(createAiEngineRateLimiter(), unlicensed);

		const headRes = await app.request('/ai-agents.engine.head?seat=seat-1', {
			headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
		});
		expect(headRes.status).toBe(400);
		expect(headRes.headers.get('cache-control')).toBe('no-store');
		await expect(headRes.json()).resolves.toMatchObject({ errorType: 'error-action-not-allowed' });

		const verRes = await app.request('/ai-agents.engine.version?seat=seat-1&version=1', {
			headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
		});
		expect(verRes.status).toBe(400);
		expect(verRes.headers.get('cache-control')).toBe('no-store');
		await expect(verRes.json()).resolves.toMatchObject({ errorType: 'error-action-not-allowed' });

		const reportRes = await app.request('/ai-agents.engine.report', {
			method: 'POST',
			headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify({ contractVersion: '1.1.0' }),
		});
		expect(reportRes.status).toBe(400);
		expect(reportRes.headers.get('cache-control')).toBe('no-store');
		await expect(reportRes.json()).resolves.toMatchObject({ errorType: 'error-action-not-allowed' });

		expect(aiSeats.findOneByEngineIdAndSeatId).not.toHaveBeenCalled();
		expect(aiEngines.updateObservedReport).not.toHaveBeenCalled();
	});

	it('enforces bearer authentication and rejects user auth headers even alongside a valid bearer token', async () => {
		const app = createAiAgentsEngineHonoApp(createAiEngineRateLimiter(), licensed);

		const noAuth = await app.request(`/ai-agents.engine.head?seat=seat-1`, {
			headers: { 'x-request-id': REQUEST_UUID },
		});
		expect(noAuth.status).toBe(401);
		expect(noAuth.headers.get('cache-control')).toBe('no-store');

		const wrongToken = await app.request(`/ai-agents.engine.head?seat=seat-1`, {
			headers: { 'authorization': 'Bearer wrong.secret', 'x-request-id': REQUEST_UUID },
		});
		expect(wrongToken.status).toBe(401);

		const withUserHeaders = await app.request(`/ai-agents.engine.head?seat=seat-1`, {
			headers: {
				'authorization': `Bearer ${token}`,
				'x-user-id': 'admin-1',
				'x-auth-token': 'user-token',
				'x-request-id': REQUEST_UUID,
			},
		});
		expect(withUserHeaders.status).toBe(401);
	});

	it('serves head and version envelopes with majority readConcern, no-store, unavailable head body, and 404 version-unavailable', async () => {
		const app = createAiAgentsEngineHonoApp(createAiEngineRateLimiter(), licensed);
		const built = buildAgentRecord110({
			id: 'seat-1',
			version: 1732450000001,
			updatedAt: '2026-11-24T12:00:00.000Z',
			name: 'Docs Helper',
			instructions: 'Answer from docs.',
			model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
			tools: ['docs_search'],
			skills: { commit: '438544159fd6359527759d2a97dd227ae9f6c58c', ids: ['public-docs'] },
			status: 'published',
			chat: { claim: REQUEST_UUID, rooms: ['room-1'] },
		});

		aiSeats.findOneByEngineIdAndSeatId.mockResolvedValue({ engineId: 'eng-1', seatId: 'seat-1', state: 'claimed' });
		aiAgents.findOneBySeatId.mockResolvedValue({ _id: 'agent-1', engineId: 'eng-1', seatId: 'seat-1', headVersion: 1732450000001 });
		aiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValue({
			agentId: 'agent-1',
			version: 1732450000001,
			bytes: built.binary,
			digest: built.digest,
		});

		const headRes = await app.request(`/ai-agents.engine.head?seat=seat-1`, {
			headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
		});
		expect(headRes.status).toBe(200);
		expect(headRes.headers.get('cache-control')).toBe('no-store');
		await expect(headRes.json()).resolves.toEqual({
			contractVersion: '1.1.0',
			requestId: REQUEST_UUID,
			engineId: 'eng-1',
			seatId: 'seat-1',
			seatState: 'claimed',
			kind: 'head',
			headVersion: 1732450000001,
			version: 1732450000001,
			digest: built.digest,
			bytes: built.rawBytes,
		});
		expect(aiSeats.findOneByEngineIdAndSeatId).toHaveBeenCalledWith('eng-1', 'seat-1', { readConcern: { level: 'majority' } });
		expect(aiAgents.findOneBySeatId).toHaveBeenCalledWith('seat-1', { readConcern: { level: 'majority' } });

		// Missing head revision returns 200 with bytes omitted and digest null so engine still raises floor.
		aiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValueOnce(null);
		const missingBodyRes = await app.request(`/ai-agents.engine.head?seat=seat-1`, {
			headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
		});
		expect(missingBodyRes.status).toBe(200);
		const missingBodyJson = await missingBodyRes.json();
		expect(missingBodyJson).not.toHaveProperty('bytes');
		expect(missingBodyJson).toMatchObject({ headVersion: 1732450000001, digest: null });

		// Historical missing version returns 404 version-unavailable.
		aiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValueOnce(null);
		const missingVerRes = await app.request(`/ai-agents.engine.version?seat=seat-1&version=1732450000000`, {
			headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
		});
		expect(missingVerRes.status).toBe(404);
		await expect(missingVerRes.json()).resolves.toMatchObject({ error: 'version-unavailable' });
	});

	it('ignores unregistered seats in engine.report and returns registered heads (R10)', async () => {
		const app = createAiAgentsEngineHonoApp(createAiEngineRateLimiter(), licensed);
		aiSeats.findByEngineId.mockReturnValue({
			toArray: async () => [{ engineId: 'eng-1', seatId: 'seat-1', state: 'registered' }],
		});
		aiAgents.findByEngineId.mockReturnValue({
			toArray: async () => [],
		});

		const reportBody = {
			contractVersion: '1.1.0',
			engineId: 'eng-1',
			workspaceId: 'ws-1',
			reportedAt: '2026-11-25T00:00:00.000Z',
			catalogue: {
				tools: ['docs_search'],
				skillsCommit: '438544159fd6359527759d2a97dd227ae9f6c58c',
				skills: ['public-docs'],
				modelRoutes: ['openrouter/openai/gpt-4o-mini'],
			},
			seats: [
				{
					seatId: 'seat-1',
					botId: 'bot-1',
					state: 'provisioned',
					availability: 'unavailable',
					reason: 'seat-provisioned',
					allowedRooms: ['room-1'],
					acceptedVersion: 0,
					poisonFloor: 0,
					identity120Seen: false,
					admittedQuestionSeen: false,
				},
				{
					seatId: 'unregistered-seat-99',
					botId: 'bot-99',
					state: 'provisioned',
					availability: 'available',
					reason: 'ready',
					allowedRooms: ['room-secret'],
					acceptedVersion: 0,
					poisonFloor: 0,
					identity120Seen: false,
					admittedQuestionSeen: false,
				},
			],
		};

		const res = await app.request('/ai-agents.engine.report', {
			method: 'POST',
			headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify(reportBody),
		});

		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual({
			success: true,
			heads: [{ seatId: 'seat-1', seatState: 'registered', headVersion: 0 }],
		});
		const [, storedObserved] = aiEngines.updateObservedReport.mock.calls[0];
		expect(storedObserved.seats.map((s: { seatId: string }) => s.seatId)).toEqual(['seat-1']);
	});

	it('stores 1.2.0 seat tool ceilings for every reported seat but keeps only registered seats in the observation', async () => {
		const app = createAiAgentsEngineHonoApp(createAiEngineRateLimiter(), licensed);
		aiSeats.findByEngineId.mockReturnValue({
			toArray: async () => [{ engineId: 'eng-1', seatId: 'seat-1', state: 'registered' }],
		});
		aiAgents.findByEngineId.mockReturnValue({ toArray: async () => [] });

		const seatEntry = {
			botId: 'bot-1',
			state: 'provisioned',
			availability: 'unavailable',
			reason: 'seat-provisioned',
			allowedRooms: ['room-1'],
			acceptedVersion: 0,
			poisonFloor: 0,
			identity120Seen: false,
			admittedQuestionSeen: false,
		};
		const res = await app.request('/ai-agents.engine.report', {
			method: 'POST',
			headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify({
				contractVersion: '1.2.0',
				engineId: 'eng-1',
				workspaceId: 'ws-1',
				reportedAt: '2026-11-25T00:00:00.000Z',
				catalogue: {
					tools: ['docs_search', 'web_fetch'],
					toolEntries: [
						{ id: 'docs_search', name: 'Search the docs', effect: 'read' },
						{ id: 'web_fetch', name: 'Fetch a public page', effect: 'read' },
					],
					skillsCommit: '438544159fd6359527759d2a97dd227ae9f6c58c',
					skills: ['public-docs'],
					modelRoutes: ['openrouter/openai/gpt-4o-mini'],
				},
				seats: [
					{ seatId: 'seat-1', ...seatEntry, allowedTools: ['docs_search'] },
					{ seatId: 'seat-2', ...seatEntry, botId: 'bot-2', allowedTools: ['web_fetch'] },
				],
			}),
		});

		expect(res.status).toBe(200);
		const [, storedObserved] = aiEngines.updateObservedReport.mock.calls[0];
		expect(storedObserved.seats.map((s: { seatId: string }) => s.seatId)).toEqual(['seat-1']);
		expect(storedObserved.seatTools).toEqual([
			{ seatId: 'seat-1', allowedTools: ['docs_search'] },
			{ seatId: 'seat-2', allowedTools: ['web_fetch'] },
		]);
	});

	it('refuses oversized engine.report bodies (> 256 KiB) with 413 BOTH with and without Content-Length before JSON.parse (R08)', async () => {
		const app = createAiAgentsEngineHonoApp(createAiEngineRateLimiter(), licensed);
		const parseSpy = jest.spyOn(JSON, 'parse');
		const oversized = `{"pad":"${'a'.repeat(MAX_ENGINE_REPORT_BODY_BYTES + 1024)}"}`;

		// 1. With Content-Length header
		const withLength = await app.request('/ai-agents.engine.report', {
			method: 'POST',
			headers: {
				'authorization': `Bearer ${token}`,
				'content-type': 'application/json',
				'content-length': String(Buffer.byteLength(oversized, 'utf8')),
			},
			body: oversized,
		});
		expect(withLength.status).toBe(413);
		expect(parseSpy).not.toHaveBeenCalled();

		// 2. Without Content-Length (streamed chunked request)
		const streamedReq = new Request('http://localhost/ai-agents.engine.report', {
			method: 'POST',
			headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
			body: makeStreamWithoutContentLength(oversized),
			// @ts-expect-error Node fetch Request duplex option for ReadableStream bodies
			duplex: 'half',
		});
		expect(streamedReq.headers.get('content-length')).toBeNull();
		const withoutLength = await app.request(streamedReq);
		expect(withoutLength.status).toBe(413);
		expect(parseSpy).not.toHaveBeenCalled();

		parseSpy.mockRestore();
	});

	it('refuses oversized management POST bodies (> 128 KiB) with 413 with and without Content-Length before downstream parsing (R08)', async () => {
		const downstream = jest.fn();
		const app = new Hono();
		app.use('/ai-agents.*', createAiAgentsBodyLimitMiddleware());
		app.post('/ai-agents.create', async (c) => {
			downstream();
			return c.json({ ok: true });
		});

		const oversized = `{"instructions":"${'b'.repeat(MAX_MANAGEMENT_BODY_BYTES + 1024)}"}`;

		const withLength = await app.request('/ai-agents.create', {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(oversized)) },
			body: oversized,
		});
		expect(withLength.status).toBe(413);
		expect(downstream).not.toHaveBeenCalled();

		const streamedReq = new Request('http://localhost/ai-agents.create', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: makeStreamWithoutContentLength(oversized),
			// @ts-expect-error Node fetch Request duplex option
			duplex: 'half',
		});
		expect(streamedReq.headers.get('content-length')).toBeNull();
		const withoutLength = await app.request(streamedReq);
		expect(withoutLength.status).toBe(413);
		expect(downstream).not.toHaveBeenCalled();
	});

	it('enforces 240/min on engine.head and 12/min on engine.report with 429 and Retry-After (R08)', async () => {
		const fixedNow = 1_764_000_000_000;
		const app = createAiAgentsEngineHonoApp(
			createAiEngineRateLimiter(() => fixedNow),
			licensed,
		);
		aiSeats.findOneByEngineIdAndSeatId.mockResolvedValue({ engineId: 'eng-1', seatId: 'seat-1', state: 'registered' });
		aiAgents.findOneBySeatId.mockResolvedValue(null);
		aiSeats.findByEngineId.mockReturnValue({ toArray: async () => [] });
		aiAgents.findByEngineId.mockReturnValue({ toArray: async () => [] });

		for (let i = 0; i < 240; i += 1) {
			const res = await app.request('/ai-agents.engine.head?seat=seat-1', {
				headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
			});
			expect(res.status).toBe(200);
		}
		const head241 = await app.request('/ai-agents.engine.head?seat=seat-1', {
			headers: { 'authorization': `Bearer ${token}`, 'x-request-id': REQUEST_UUID },
		});
		expect(head241.status).toBe(429);
		expect(head241.headers.get('retry-after')).toBeTruthy();

		const validReport = JSON.stringify({
			contractVersion: '1.1.0',
			engineId: 'eng-1',
			workspaceId: 'ws-1',
			reportedAt: '2026-11-25T00:00:00.000Z',
			catalogue: {
				tools: ['docs_search'],
				skillsCommit: '438544159fd6359527759d2a97dd227ae9f6c58c',
				skills: ['public-docs'],
				modelRoutes: ['openrouter/openai/gpt-4o-mini'],
			},
			seats: [],
		});

		for (let i = 0; i < 12; i += 1) {
			const res = await app.request('/ai-agents.engine.report', {
				method: 'POST',
				headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
				body: validReport,
			});
			expect(res.status).toBe(200);
		}
		const report13 = await app.request('/ai-agents.engine.report', {
			method: 'POST',
			headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
			body: validReport,
		});
		expect(report13.status).toBe(429);
		expect(report13.headers.get('retry-after')).toBeTruthy();
	});
});
