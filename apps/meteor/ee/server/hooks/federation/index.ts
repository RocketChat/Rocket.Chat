import { FederationMatrix } from '@rocket.chat/core-services';

import { callbacks } from '../../../../lib/callbacks';
import type { IMessage, IUser } from '@rocket.chat/core-typings';

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
