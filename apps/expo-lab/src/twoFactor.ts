import type { RestClient } from '@rocket.chat/api-client';

export type CodeRequest = { method: string; invalid: boolean };

export type AskCode = (request: CodeRequest) => Promise<string>;

type LoginData = { userId: string; authToken: string };

type ErrorBody = { error?: string; details?: { method?: string } };

// /v1/login answers 401 (not 400) for a missing or wrong code, so the api-client's own 2FA handler never fires.
const readErrorBody = async (e: unknown): Promise<ErrorBody> => {
	if (typeof e !== 'object' || e === null || !('json' in e) || typeof e.json !== 'function') return {};
	try {
		return (await e.json()) as ErrorBody;
	} catch {
		return {};
	}
};

// The code goes in the body; the server wraps it as { totp: { code, login } } and checks it against the user's first enabled method.
export async function loginWithCode(rest: RestClient, user: string, password: string, askCode: AskCode): Promise<LoginData> {
	let code: string | undefined;
	for (;;) {
		try {
			const { data } = await rest.post('/v1/login', { user, password, ...(code && { code }) });
			return data as LoginData;
		} catch (e) {
			const body = await readErrorBody(e);
			if (body.error !== 'totp-required' && body.error !== 'totp-invalid') throw e;
			code = await askCode({ method: body.details?.method ?? 'totp', invalid: body.error === 'totp-invalid' });
		}
	}
}
