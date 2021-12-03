import { e2e } from './rocketchat.e2e';
import { Notifications } from '../../notifications/client';
import { IRoom } from '../../../definition/IRoom';

export const attachKeyRequestHandler = (): (() => void) => {
	const handleKeyRequest = async (roomId: IRoom['_id'], keyId: string): Promise<void> => {
		const e2eRoom = await e2e.getInstanceByRoomId(roomId);
		if (!e2eRoom) {
			return;
		}

		e2eRoom.provideKeyToUser(keyId);
	};

	Notifications.onUser('e2e.keyRequest', handleKeyRequest);

	return (): void => {
		Notifications.unUser('e2e.keyRequest', handleKeyRequest);
	};
};
