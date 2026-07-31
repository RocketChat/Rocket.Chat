import type { AppManager } from '@rocket.chat/apps/dist/server/AppManager';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';

import type { AppAccessors } from './accessors/mod';
import { bridgeCall } from './bridges/bridgeCall';
import { Room } from './room';

const getMockAppManager = (senderFn: AppAccessors['senderFn']) => {
	return {
		getBridges: () => ({
			getInternalBridge: () => ({
				doGetUsernamesOfRoomById: (roomId: string) => bridgeCall(senderFn, 'getInternalBridge', 'doGetUsernamesOfRoomById', roomId),
			}),
		}),
	};
};

export default function createRoom(room: IRoom, senderFn: AppAccessors['senderFn']) {
	const mockAppManager = getMockAppManager(senderFn);

	return new Room(room, mockAppManager as unknown as AppManager);
}
