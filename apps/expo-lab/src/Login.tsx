import { useRef, useState } from 'react';
import { Text as RNText, TextInput, Switch, View } from 'react-native';
import { Button, YStack } from 'tamagui';

import { isHttpError } from './api';
import type { CodeRequest } from './twoFactor';
import { login, type Credentials, type Session } from './session';

const input = { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 10, fontSize: 16 } as const;

const codeLabels: Record<string, string> = {
	totp: 'Authenticator app code',
	email: 'Code sent to your email',
};

export function Login({ onSession }: { onSession: (session: Session) => void }) {
	const [serverUrl, setServerUrl] = useState('https://open.rocket.chat');
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

	return (
		<YStack flex={1} padding={24} paddingTop={96} gap={12}>
			<RNText>Server URL</RNText>
			<TextInput style={input} value={serverUrl} onChangeText={setServerUrl} autoCapitalize='none' autoCorrect={false} />
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<Switch value={useToken} onValueChange={setUseToken} />
				<RNText>Personal access token</RNText>
			</View>
			{useToken ? (
				<>
					<RNText>User ID</RNText>
					<TextInput style={input} value={userId} onChangeText={setUserId} autoCapitalize='none' autoCorrect={false} />
				</>
			) : (
				<>
					<RNText>Username</RNText>
					<TextInput style={input} value={username} onChangeText={setUsername} autoCapitalize='none' autoCorrect={false} />
				</>
			)}
			<RNText>{useToken ? 'Token' : 'Password'}</RNText>
			<TextInput style={input} value={secret} onChangeText={setSecret} secureTextEntry autoCapitalize='none' autoCorrect={false} />
			{codeRequest && (
				<>
					<RNText>{codeLabels[codeRequest.method] ?? 'Two-factor code'}</RNText>
					{codeRequest.invalid && <RNText style={{ color: 'crimson' }}>Invalid code, try again</RNText>}
					<TextInput
						style={input}
						value={code}
						onChangeText={setCode}
						keyboardType='number-pad'
						autoCapitalize='none'
						autoCorrect={false}
						autoFocus
					/>
					<Button onPress={submitCode}>Verify</Button>
					<Button onPress={cancelCode}>Cancel</Button>
				</>
			)}
			<Button onPress={submit} disabled={busy}>
				{busy ? 'Signing in...' : 'Sign in'}
			</Button>
			{error && <RNText style={{ color: 'crimson' }}>{error}</RNText>}
		</YStack>
	);
}
