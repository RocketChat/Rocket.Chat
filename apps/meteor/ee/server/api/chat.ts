import type { IMessage, IReadReceiptWithUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import {
	ajv,
	isChatGetMessageReadReceiptsProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { chatExamples } from './chat.examples';
import { API } from '../../../server/api/api';
import { getReadReceiptsFunction } from '../meteor-methods/getReadReceipts';

type GetMessageReadReceiptsProps = {
	messageId: IMessage['_id'];
};

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/chat.getMessageReadReceipts': {
			GET: (params: GetMessageReadReceiptsProps) => {
				receipts: IReadReceiptWithUser[];
			};
		};
	}
}

const getMessageReadReceiptsResponseSchema = ajv.compile<{ receipts: IReadReceiptWithUser[] }>({
	type: 'object',
	properties: {
		receipts: { type: 'array', items: { $ref: '#/components/schemas/IReadReceiptWithUser' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['receipts', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'chat.getMessageReadReceipts',
	{
		summary: 'Get Message Read Receipts',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Get the <a href='https://docs.rocket.chat/docs/message-actions#read-receipts' target='_blank'>read receipts</a> of messages.

### Changelog
| Version      | Description |
| ---------------- | ------------|
| 0.63.0          | Added       |`,
		examples: chatExamples['chat.getMessageReadReceipts'],
		tags: ['Chat'],
		authRequired: true,
		query: isChatGetMessageReadReceiptsProps,
		response: {
			200: getMessageReadReceiptsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		if (!License.hasModule('message-read-receipt')) {
			throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
		}

		const { messageId } = this.queryParams;

		return API.v1.success({
			receipts: await getReadReceiptsFunction(messageId, this.userId),
		});
	},
);
