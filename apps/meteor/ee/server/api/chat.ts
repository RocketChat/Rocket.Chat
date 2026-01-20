import { License } from '@rocket.chat/license';
import {
	BadRequestErrorResponseSchema,
	UnauthorizedErrorResponseSchema,
	GETChatGetMessageReadReceiptsQuerySchema,
	GETChatGetMessageReadReceiptsResponseSchema,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import type { ExtractRoutesFromAPI } from '../../../app/api/server/ApiClass';
import { API } from '../../../app/api/server/api';
import { getReadReceiptsFunction } from '../methods/getReadReceipts';

const chatEndpoints = API.v1.get(
	'chat.getMessageReadReceipts',
	{
		authRequired: true,
		// license: ['message-read-receipt'],
		query: GETChatGetMessageReadReceiptsQuerySchema,
		response: {
			200: GETChatGetMessageReadReceiptsResponseSchema,
			400: BadRequestErrorResponseSchema,
			401: UnauthorizedErrorResponseSchema,
		},
	},
	async function action() {
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
);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof chatEndpoints> {}
}
