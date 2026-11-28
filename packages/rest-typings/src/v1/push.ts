import type { IMessage, IPushNotificationConfig, IPushTokenTypes } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';

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

export const isPushGetProps = ajvQuery.compile<PushGetProps>(PushGetPropsSchema);

// Public mirror of the implementation-derived routes (apps/meteor/server/api/v1/push.ts,
// `ExtractRoutesFromAPI<typeof ...>`). Kept identical so the two declarations merge without
// TS2320, and so SDK/external consumers that don't compile apps/meteor keep these routes.
export type PushEndpoints = {
	'/v1/push.get': {
		GET: (params: PushGetProps) => {
			data: {
				message: IMessage;
				notification: IPushNotificationConfig;
			};
		};
	};
	'/v1/push.info': {
		GET: (params?: never) => {
			pushGatewayEnabled: boolean;
			defaultPushGateway: boolean;
		};
	};
};
