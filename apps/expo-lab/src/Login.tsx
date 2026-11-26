import { useState } from 'react';
import { Text as RNText, TextInput, Switch, View } from 'react-native';
import { Button, YStack } from 'tamagui';

import type { Session } from './session';
import { codeLabels, useLogin } from './useLogin';

const input = { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 10, fontSize: 16 } as const;

export function Login({ onSession }: { onSession: (session: Session) => void }) {
	const form = useLogin(onSession);
	const { codeRequest } = form;
	const [gallery, setGallery] = useState(process.env.EXPO_PUBLIC_GALLERY === '1');
	const [sweep, setSweep] = useState(process.env.EXPO_PUBLIC_SWEEP === '1');
	const [composer, setComposer] = useState(false);

	if (composer) {
		// Without Fuselage here: the plain screens already own the Tamagui config
		const { ComposerLab } = require('./ComposerLab') as typeof import('./ComposerLab');
		return <ComposerLab onBack={() => setComposer(false)} />;
	}

	if (sweep) {
		const { Sweep } = require('./Sweep') as typeof import('./Sweep');
		return <Sweep onBack={() => setSweep(false)} />;
	}

	if (gallery) {
		// Loaded on demand: importing Fuselage registers its own Tamagui config
		const { Gallery } = require('./Gallery') as typeof import('./Gallery');
		return <Gallery onBack={() => setGallery(false)} />;
	}

	return (
		<YStack flex={1} padding={24} paddingTop={96} gap={12}>
			<RNText>Server URL</RNText>
			<TextInput style={input} value={form.serverUrl} onChangeText={form.setServerUrl} autoCapitalize='none' autoCorrect={false} />
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<Switch value={form.useToken} onValueChange={form.setUseToken} />
				<RNText>Personal access token</RNText>
			</View>
			{form.useToken ? (
				<>
					<RNText>User ID</RNText>
					<TextInput style={input} value={form.userId} onChangeText={form.setUserId} autoCapitalize='none' autoCorrect={false} />
				</>
			) : (
				<>
					<RNText>Username</RNText>
					<TextInput style={input} value={form.username} onChangeText={form.setUsername} autoCapitalize='none' autoCorrect={false} />
				</>
			)}
			<RNText>{form.useToken ? 'Token' : 'Password'}</RNText>
			<TextInput style={input} value={form.secret} onChangeText={form.setSecret} secureTextEntry autoCapitalize='none' autoCorrect={false} />
			{codeRequest && (
				<>
					<RNText>{codeLabels[codeRequest.method] ?? 'Two-factor code'}</RNText>
					{codeRequest.invalid && <RNText style={{ color: 'crimson' }}>Invalid code, try again</RNText>}
					<TextInput
						style={input}
						value={form.code}
						onChangeText={form.setCode}
						keyboardType='number-pad'
						autoCapitalize='none'
						autoCorrect={false}
						autoFocus
					/>
					<Button onPress={form.submitCode}>Verify</Button>
					<Button onPress={form.cancelCode}>Cancel</Button>
				</>
			)}
			<Button onPress={form.submit} disabled={form.busy}>
				{form.busy ? 'Signing in...' : 'Sign in'}
			</Button>
			{form.error && <RNText style={{ color: 'crimson' }}>{form.error}</RNText>}
			<Button onPress={() => setGallery(true)}>Components</Button>
			<Button onPress={() => setSweep(true)}>Sweep</Button>
			<Button onPress={() => setComposer(true)}>Composer lab</Button>
		</YStack>
	);
}
