import type { RoomItem } from '../api';
import type { Session } from '../session';
import { FuselageLogin } from './FuselageLogin';
import { FuselageProvider } from './FuselageProvider';
import { FuselageRoom } from './FuselageRoom';
import { FuselageRooms } from './FuselageRooms';

type Props = {
	session?: Session;
	room?: RoomItem;
	onSession: (session: Session) => void;
	onOpen: (room: RoomItem) => void;
	onBack: () => void;
	onLogout: () => void;
};

export function FuselageChat({ session, room, onSession, onOpen, onBack, onLogout }: Props) {
	return (
		<FuselageProvider>
			{!session ? (
				<FuselageLogin onSession={onSession} />
			) : room ? (
				<FuselageRoom session={session} room={room} onBack={onBack} />
			) : (
				<FuselageRooms session={session} onOpen={onOpen} onLogout={onLogout} />
			)}
		</FuselageProvider>
	);
}
