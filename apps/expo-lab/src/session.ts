import { DDPSDK } from '@rocket.chat/ddp-client';

import { loginWithCode, type AskCode } from './twoFactor';

export type Session = { sdk: DDPSDK; userId: string; serverUrl: string };

export type Credentials =
	| { kind: 'password'; username: string; password: string }
	| { kind: 'token'; userId: string; token: string };

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '');

// Memory only: the session is gone when the app restarts.
export async function login(rawUrl: string, credentials: Credentials, askCode: AskCode): Promise<Session> {
	const serverUrl = normalizeUrl(rawUrl);
	const sdk = DDPSDK.create(serverUrl);

	let userId: string;
	let token: string;
	if (credentials.kind === 'password') {
		const data = await loginWithCode(sdk.rest, credentials.username, credentials.password, askCode);
		userId = data.userId;
		token = data.authToken;
	} else {
		userId = credentials.userId;
		token = credentials.token;
	}

	// The SDK logs in over DDP with this token on every (re)connection.
	sdk.account.setCredentials({ id: userId, token });
	const me = await sdk.rest.get('/v1/me');
	if (!me.success) throw new Error('Login refused');

	await sdk.connection.connect();
	return { sdk, userId, serverUrl };
}
