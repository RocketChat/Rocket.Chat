import { MOCK_SERVER_URL } from '../e2e/config/constants';

type Decision = 'DECISION_PERMIT' | 'DECISION_DENY';

export const mockServerSet = async (method: string, path: string, body: unknown, statusCode = 200, times = 0): Promise<void> => {
	const res = await fetch(`${MOCK_SERVER_URL}/__mock/set`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			method,
			path,
			response: { status_code: statusCode, body, times },
		}),
	});
	if (!res.ok) {
		throw new Error(`Failed to program mock-server: ${res.status} ${await res.text()}`);
	}
};

export const mockServerSetMany = async (
	mocks: Array<{ method: string; path: string; body: unknown; statusCode?: number; times?: number }>,
): Promise<void> => {
	const res = await fetch(`${MOCK_SERVER_URL}/__mock/set-many`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(
			mocks.map((m) => ({
				method: m.method,
				path: m.path,
				response: { status_code: m.statusCode ?? 200, body: m.body, times: m.times ?? 0 },
			})),
		),
	});
	if (!res.ok) {
		throw new Error(`Failed to program mock-server (set-many): ${res.status} ${await res.text()}`);
	}
};

export const mockServerReset = async (): Promise<void> => {
	await fetch(`${MOCK_SERVER_URL}/__mock/reset`, { method: 'DELETE' });
};

export const mockServerHealthy = async (): Promise<boolean> => {
	try {
		const res = await fetch(`${MOCK_SERVER_URL}/__mock/health`);
		return res.ok;
	} catch {
		return false;
	}
};

export const seedDefaultMocks = async () => {
	await mockServerSetMany([
		{
			method: 'GET',
			path: '/healthz',
			body: { status: 'SERVING' },
		},
		{
			method: 'POST',
			path: '/auth/realms/mock/protocol/openid-connect/token',
			body: { access_token: 'mock-pdp-token', token_type: 'Bearer', expires_in: 3600 },
		},
	]);
};

export const seedGetDecisions = async (decision: Decision, times = 0) => {
	await mockServerSet('POST', '/authorization.AuthorizationService/GetDecisions', { decisionResponses: [{ decision }] }, 200, times);
};

export const seedGetDecisionBulk = async (
	responses: Array<{ resourceDecisions: Array<{ decision: Decision; ephemeralResourceId?: string }> }>,
	times = 0,
) => {
	await mockServerSet('POST', '/authorization.v2.AuthorizationService/GetDecisionBulk', { decisionResponses: responses }, 200, times);
};

export const seedBulkDecisionByEntity = async (permitValues: string[], defaultDecision: Decision = 'DECISION_DENY') => {
	const res = await fetch(`${MOCK_SERVER_URL}/__mock/set-bulk-decision`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ permit_values: permitValues, default_decision: defaultDecision }),
	});
	if (!res.ok) {
		throw new Error(`Failed to program mock-server (set-bulk-decision): ${res.status} ${await res.text()}`);
	}
};
