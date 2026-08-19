import { MOCK_SERVER_URL } from '../e2e/config/constants';

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
