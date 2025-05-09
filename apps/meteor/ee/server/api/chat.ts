import type { IMessage, ReadReceipt } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { API } from '../../../app/api/server/api';
import { getReadReceiptsFunction } from '../methods/getReadReceipts';

type GetMessageReadReceiptsProps = {
	messageId: IMessage['_id'];
};

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/chat.getMessageReadReceipts': {
			GET: (params: GetMessageReadReceiptsProps) => {
				receipts: ReadReceipt[];
			};
		};
	}
}

API.v1.addRoute(
	'chat.getMessageReadReceipts',
	{
		authRequired: true,
		// license: ['message-read-receipt']
	},
	{
		async get() {
			if (!License.hasModule('message-read-receipt')) {
				throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
			}

			const { messageId } = this.queryParams;
			if (!messageId) {
				return API.v1.failure({
					error: "The required 'messageId' param is missing.",
				});
			}

			return API.v1.success({
				receipts: await getReadReceiptsFunction(messageId, this.userId),
			});
		},
	},
);
