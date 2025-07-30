import { FederationMatrix } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';

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
		await FederationMatrix.removeReaction(params.oldMessage._id, params.reaction, params.user, params.oldMessage);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-unset-reaction',
);
