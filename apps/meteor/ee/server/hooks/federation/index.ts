import { FederationMatrix } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'afterSetReaction',
	async (message: IMessage, params: { user: IUser; reaction: string }): Promise<void> => {
		await FederationMatrix.sendReaction(message._id, params.reaction, params.user);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-set-reaction',
);

callbacks.add(
	'afterUnsetReaction',
	async (_message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
		await FederationMatrix.removeReaction(params.oldMessage._id, params.reaction, params.user);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-unset-reaction',
);

callbacks.add(
	'afterLeaveRoom',
	async (user: IUser, room: IRoom): Promise<void> => {
		await FederationMatrix.leaveRoom(room._id, user);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-leave-room',
);

callbacks.add(
	'afterRemoveFromRoom',
	async (data: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom): Promise<void> => {
		await FederationMatrix.kickUser(room._id, data.removedUser, data.userWhoRemoved);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-remove-from-room',
);
