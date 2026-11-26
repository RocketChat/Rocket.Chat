import { useRef, useState } from 'react';

import { isHttpError } from './api';
import { getLastServerUrl } from './sessionStore';
import { login, type Credentials, type Session } from './session';
import type { CodeRequest } from './twoFactor';

export const codeLabels: Record<string, string> = {
	totp: 'Authenticator app code',
	email: 'Code sent to your email',
};

// The login form's state and actions, shared by the plain and the Fuselage screens
export function useLogin(onSession: (session: Session) => void) {
	const [serverUrl, setServerUrl] = useState(getLastServerUrl() ?? 'https://open.rocket.chat');
	const [useToken, setUseToken] = useState(false);
	const [username, setUsername] = useState('');
	const [secret, setSecret] = useState('');
	const [userId, setUserId] = useState('');
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);
	const [codeRequest, setCodeRequest] = useState<CodeRequest>();
	const [code, setCode] = useState('');
	const answer = useRef<{ resolve: (code: string) => void; reject: (e: Error) => void } | undefined>(undefined);

	const askCode = (request: CodeRequest) =>
		new Promise<string>((resolve, reject) => {
			answer.current = { resolve, reject };
			setCode('');
			setCodeRequest(request);
		});

	const submitCode = () => {
		setCodeRequest(undefined);
		answer.current?.resolve(code.trim());
	};

	const cancelCode = () => {
		setCodeRequest(undefined);
		answer.current?.reject(new Error('Two-factor code cancelled'));
	};

	const submit = async () => {
		setBusy(true);
		setError(undefined);
		const credentials: Credentials = useToken
			? { kind: 'token', userId, token: secret }
			: { kind: 'password', username, password: secret };
		try {
			onSession(await login(serverUrl, credentials, askCode));
		} catch (e) {
			setError(isHttpError(e) ? `HTTP ${e.status}` : e instanceof Error ? e.message : String(e));
			setBusy(false);
		}
	};

	return {
		serverUrl,
		setServerUrl,
		useToken,
		setUseToken,
		username,
		setUsername,
		secret,
		setSecret,
		userId,
		setUserId,
		error,
		busy,
		codeRequest,
		code,
		setCode,
		submit,
		submitCode,
		cancelCode,
	};
}
