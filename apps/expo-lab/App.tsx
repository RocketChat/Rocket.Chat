import { useState } from 'react';
import { TamaguiProvider } from 'tamagui';

import { Login } from './src/Login';
import { Room } from './src/Room';
import { Rooms } from './src/Rooms';
import type { RoomItem } from './src/api';
import type { Session } from './src/session';
import { config } from './tamagui.config';

export default function App() {
	const [session, setSession] = useState<Session>();
	const [room, setRoom] = useState<RoomItem>();

	const logout = () => {
		session?.sdk.connection.close();
		setRoom(undefined);
		setSession(undefined);
	};

	return (
		<TamaguiProvider config={config} defaultTheme='light'>
			{!session ? (
				<Login onSession={setSession} />
			) : room ? (
				<Room session={session} room={room} onBack={() => setRoom(undefined)} />
			) : (
				<Rooms session={session} onOpen={setRoom} onLogout={logout} />
			)}
		</TamaguiProvider>
	);
}
