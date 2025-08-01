import { FederationMatrix } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'native-federation.onAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
	callbacks.priority.MEDIUM,
	'native-federation-on-add-users-to-room ',
);

callbacks.add(
	'native-federation.onAfterAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
	callbacks.priority.MEDIUM,
	'native-federation-on-after-add-users-to-room ',
);

callbacks.add('afterSetReaction',
	async (message: IMessage, params: { user: IUser; reaction: string }): Promise<void> => {
		// Don't federate reactions that came from Matrix
		if (params.user.username?.includes(':')) {
			return;
		}
		await FederationMatrix.sendReaction(message._id, params.reaction, params.user);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-set-reaction',
);

callbacks.add(
	'afterUnsetReaction',
	async (_message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
		// Don't federate reactions that came from Matrix
		if (params.user.username?.includes(':')) {
			return;
		}
		await FederationMatrix.removeReaction(params.oldMessage._id, params.reaction, params.user, params.oldMessage);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-unset-reaction',
);
