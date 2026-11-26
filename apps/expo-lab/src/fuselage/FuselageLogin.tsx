import type { ReactNode } from 'react';
import { Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import {
	Button,
	Field,
	FieldError,
	FieldLabel,
	FieldRow,
	TextInput,
	ToggleSwitch,
	UrlInput,
} from '@rocket.chat/fuselage';

import type { Session } from '../session';
import { codeLabels, useLogin } from '../useLogin';

// On native the input's onChange receives the string value; on the web it receives an event
const onText = (set: (value: string) => void) => (value: unknown) => set(String(value));

// PasswordInput shows the text in the clear on native (its type='password' never becomes secureTextEntry), so the secret stays a React Native input
// The input frames draw no border or background on native yet, so a field would look like loose text
const Boxed = ({ children }: { children: ReactNode }) => (
	<View style={{ flex: 1, borderWidth: 1, borderColor: '#9ea2a8', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6 }}>{children}</View>
);

export function FuselageLogin({ onSession }: { onSession: (session: Session) => void }) {
	const form = useLogin(onSession);
	const { codeRequest } = form;

	return (
		<View style={{ flex: 1, padding: 24, paddingTop: 96, gap: 12 }}>
			<Field>
				<FieldLabel>Server URL</FieldLabel>
				<FieldRow>
					<Boxed>
						<UrlInput value={form.serverUrl} onChange={onText(form.setServerUrl)} autoCapitalize='none' />
					</Boxed>
				</FieldRow>
			</Field>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<ToggleSwitch checked={form.useToken} onChange={() => form.setUseToken(!form.useToken)} aria-label='Personal access token' />
				<RNText>Personal access token</RNText>
			</View>
			<Field>
				<FieldLabel>{form.useToken ? 'User ID' : 'Username'}</FieldLabel>
				<FieldRow>
					<Boxed>
						<TextInput
							value={form.useToken ? form.userId : form.username}
							onChange={onText(form.useToken ? form.setUserId : form.setUsername)}
							autoCapitalize='none'
						/>
					</Boxed>
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel>{form.useToken ? 'Token' : 'Password'}</FieldLabel>
				<FieldRow>
					<Boxed>
						<RNTextInput value={form.secret} onChangeText={form.setSecret} secureTextEntry autoCapitalize='none' autoCorrect={false} style={{ fontSize: 16 }} />
					</Boxed>
				</FieldRow>
			</Field>
			{codeRequest && (
				<Field>
					<FieldLabel>{codeLabels[codeRequest.method] ?? 'Two-factor code'}</FieldLabel>
					<FieldRow>
						<Boxed>
							<TextInput value={form.code} onChange={onText(form.setCode)} autoCapitalize='none' />
						</Boxed>
					</FieldRow>
					{codeRequest.invalid && <FieldError>Invalid code, try again</FieldError>}
					<FieldRow>
						<Button variant='primary' onPress={form.submitCode}>
							Verify
						</Button>
						<Button onPress={form.cancelCode}>Cancel</Button>
					</FieldRow>
				</Field>
			)}
			<Button variant='primary' onPress={form.submit} disabled={form.busy}>
				{form.busy ? 'Signing in...' : 'Sign in'}
			</Button>
			{form.error && <RNText style={{ color: 'crimson' }}>{form.error}</RNText>}
		</View>
	);
}
