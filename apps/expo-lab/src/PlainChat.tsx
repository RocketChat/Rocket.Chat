import { TamaguiProvider } from 'tamagui';

import { config } from '../tamagui.config';
import { Login } from './Login';
import { Room } from './Room';
import { Rooms } from './Rooms';
import type { RoomItem } from './api';
import type { Session } from './session';

type Props = {
	session?: Session;
	room?: RoomItem;
	onSession: (session: Session) => void;
	onOpen: (room: RoomItem) => void;
	onBack: () => void;
	onLogout: () => void;
};

export function PlainChat({ session, room, onSession, onOpen, onBack, onLogout }: Props) {
	return (
		<TamaguiProvider config={config} defaultTheme='light'>
			{!session ? (
				<Login onSession={onSession} />
			) : room ? (
				<Room session={session} room={room} onBack={onBack} />
			) : (
				<Rooms session={session} onOpen={onOpen} onLogout={onLogout} />
			)}
		</TamaguiProvider>
	);
}
