import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import type { RoomItem } from './src/api';
import { fuselageUi, mockStart } from './src/chatConfig';
import { mockRooms } from './src/mockData';
import { login, signOutWithPrompts, useRestoreSession, type Session, type SignOutUi } from './src/session';

const signOutUi: SignOutUi = {
	askRevoke: () =>
		new Promise((resolve) =>
			Alert.alert(
				'Also revoke this session on the server?',
				'This older saved session may be a personal access token that other integrations also use. Revoking it would sign them out too.',
				[
					{ text: 'Only sign out here', onPress: () => resolve(false) },
					{ text: 'Revoke', style: 'destructive', onPress: () => resolve(true) },
				],
				{ cancelable: false },
			),
		),
	clearFailed: (canRetry) =>
		new Promise((resolve) =>
			Alert.alert(
				'Could not clear the saved session',
				'You may be signed in again the next time you open the app.',
				[...(canRetry ? [{ text: 'Try again', onPress: () => resolve(true) }] : []), { text: 'Dismiss', onPress: () => resolve(false) }],
				{ cancelable: false },
			),
		),
};

export default function App() {
	const [session, setSession] = useState<Session>();
	const [room, setRoom] = useState<RoomItem | undefined>(mockStart === 'room' ? mockRooms[0] : undefined);

	// Dev only: EXPO_PUBLIC_CHAT_MOCK=rooms|room starts past the login, with no network
	useEffect(() => {
		if (mockStart) login('https://mock.invalid', { kind: 'token', userId: 'mock', token: 'mock' }, () => Promise.reject(new Error('no code'))).then(setSession);
	}, []);

	const restoration = useRestoreSession();
	useEffect(() => {
		if (restoration.state.status === 'restored') setSession(restoration.state.session);
	}, [restoration.state]);

	const signingOut = useRef(false);
	const logout = async () => {
		if (signingOut.current) return;
		signingOut.current = true;
		try {
			const leaving = session;
			restoration.skip();
			setRoom(undefined);
			setSession(undefined);
			await signOutWithPrompts(leaving, signOutUi);
		} finally {
			signingOut.current = false;
		}
	};

	// Dev only: EXPO_PUBLIC_COMPOSER_LAB=1 opens the TextInput probe, Fuselage included, instead of the chat
	if (process.env.EXPO_PUBLIC_COMPOSER_LAB === '1') {
		const { ComposerLab } = require('./src/ComposerLab') as typeof import('./src/ComposerLab');
		const { FuselageArea, FuselageProvider } = require('./src/FuselageField') as typeof import('./src/FuselageField');
		return <ComposerLab fuselage={{ Provider: FuselageProvider, Area: FuselageArea }} />;
	}

	if (process.env.EXPO_PUBLIC_SESSION_LAB === '1') {
		const { SessionLab } = require('./src/SessionLab') as typeof import('./src/SessionLab');
		return <SessionLab />;
	}

	const { status } = restoration.state;
	if (!session && (status === 'restoring' || status === 'restored' || status === 'offline')) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
				{status === 'offline' ? (
					<>
						<Text style={{ fontSize: 16 }}>Could not reach the server</Text>
						<Pressable onPress={restoration.retry} style={{ padding: 12, borderWidth: 1, borderColor: '#999', borderRadius: 6 }}>
							<Text>Retry</Text>
						</Pressable>
						<Pressable onPress={restoration.skip}>
							<Text style={{ color: '#555' }}>Sign in instead</Text>
						</Pressable>
					</>
				) : (
					<>
						<ActivityIndicator />
						<Text>Restoring session</Text>
					</>
				)}
			</View>
		);
	}

	const props = { session, room, onSession: setSession, onOpen: setRoom, onBack: () => setRoom(undefined), onLogout: logout };

	// Each UI is loaded on demand: Fuselage and the plain screens each create their own Tamagui config, and only one may exist
	// The gallery and the sweep open from the plain login, so asking for them first selects it
	const devScreen = process.env.EXPO_PUBLIC_GALLERY === '1' || process.env.EXPO_PUBLIC_SWEEP === '1';
	if (fuselageUi && !devScreen) {
		const { FuselageChat } = require('./src/fuselage/FuselageChat') as typeof import('./src/fuselage/FuselageChat');
		return <FuselageChat {...props} />;
	}
	const { PlainChat } = require('./src/PlainChat') as typeof import('./src/PlainChat');
	return <PlainChat {...props} />;
}
