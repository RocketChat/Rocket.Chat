import type { IMessage, ReadReceipt } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type GetMessageReadReceiptsProps = {
	messageId: IMessage['_id'];
};

const getMessageReadReceiptsPropsSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isGetMessageReadReceiptsProps = ajv.compile<GetMessageReadReceiptsProps>(getMessageReadReceiptsPropsSchema);

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
