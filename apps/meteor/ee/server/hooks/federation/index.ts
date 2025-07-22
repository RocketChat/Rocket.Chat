import { FederationMatrix } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'afterDeleteMessage',
	async (message: IMessage) => FederationMatrix.deleteMessage(message),
	callbacks.priority.MEDIUM,
	'native-federation-after-delete-message',
);
