import type { IMessage, IPushNotificationConfig, IPushTokenTypes, IPushToken } from '@rocket.chat/core-typings';

import { ajv } from '../helpers/schemas';

type PushTokenProps = {
	id?: string;
	type: IPushTokenTypes;
	value: string;
	appName: string;
};

const PushTokenPropsSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
		},
		value: {
			type: 'string',
		},
		appName: {
			type: 'string',
		},
	},
	required: ['type', 'value', 'appName'],
	additionalProperties: false,
};

export const isPushTokenProps = ajv.compile<PushTokenProps>(PushTokenPropsSchema);

type PushGetProps = {
	id: string;
};

const PushGetPropsSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
		},
	},
	required: ['id'],
	additionalProperties: false,
};

export const isPushGetProps = ajv.compile<PushGetProps>(PushGetPropsSchema);

export type PushEndpoints = {
	'/v1/push.token': {
		POST: (payload: PushTokenProps) => { result: IPushToken };
		DELETE: (payload: { token: string }) => void;
	};
	'/v1/push.get': {
		GET: (params: PushGetProps) => {
			data: {
				message: IMessage;
				notification: IPushNotificationConfig;
			};
		};
	};
};
