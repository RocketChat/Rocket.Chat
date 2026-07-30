import type { AppManager } from '@rocket.chat/apps/dist/server/AppManager';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom';

import type { AppAccessors } from './accessors/mod';
import { RemoteBridges } from './bridges/RemoteBridges';
import { Room } from './room';

const getMockAppManager = (senderFn: AppAccessors['senderFn']) => {
	const bridges = new RemoteBridges(senderFn);

	return {
		getBridges: () => ({
			getInternalBridge: () => ({
				doGetUsernamesOfRoomById: (roomId: string) => bridges.getInternalBridge().doGetUsernamesOfRoomById(roomId),
			}),
		}),
	};
};

export default function createRoom(room: IRoom, senderFn: AppAccessors['senderFn']) {
	const mockAppManager = getMockAppManager(senderFn);

	return new Room(room, mockAppManager as unknown as AppManager);
}
