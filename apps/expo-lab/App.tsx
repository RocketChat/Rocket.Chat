import { useEffect, useState } from 'react';

import type { RoomItem } from './src/api';
import { fuselageUi, mockStart } from './src/chatConfig';
import { mockRooms } from './src/mockData';
import { login, type Session } from './src/session';

export default function App() {
	const [session, setSession] = useState<Session>();
	const [room, setRoom] = useState<RoomItem | undefined>(mockStart === 'room' ? mockRooms[0] : undefined);

	// Dev only: EXPO_PUBLIC_CHAT_MOCK=rooms|room starts past the login, with no network
	useEffect(() => {
		if (mockStart) login('https://mock.invalid', { kind: 'token', userId: 'mock', token: 'mock' }, () => Promise.reject(new Error('no code'))).then(setSession);
	}, []);

	const logout = () => {
		session?.sdk.connection.close();
		setRoom(undefined);
		setSession(undefined);
	};

	// Dev only: EXPO_PUBLIC_COMPOSER_LAB=1 opens the TextInput probe, Fuselage included, instead of the chat
	if (process.env.EXPO_PUBLIC_COMPOSER_LAB === '1') {
		const { ComposerLab } = require('./src/ComposerLab') as typeof import('./src/ComposerLab');
		const { FuselageArea, FuselageProvider } = require('./src/FuselageField') as typeof import('./src/FuselageField');
		return <ComposerLab fuselage={{ Provider: FuselageProvider, Area: FuselageArea }} />;
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
