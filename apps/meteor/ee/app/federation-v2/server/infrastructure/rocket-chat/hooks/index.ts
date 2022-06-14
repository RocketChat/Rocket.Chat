import { IRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../../lib/callbacks';

export class FederationHooksEE {
	public static onFederatedRoomCreated(callback: Function): void {
		callbacks.add(
			'federation.afterCreateFederatedRoom',
			(room: IRoom, { owner, originalMemberList }): void => Promise.await(callback(room, owner, originalMemberList.filter(Boolean))),
			callbacks.priority.HIGH,
			'federation-v2-after-create-room',
		);
	}
}
