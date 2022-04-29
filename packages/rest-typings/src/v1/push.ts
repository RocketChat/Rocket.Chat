import type { IMessage, IPushTokenTypes, IPushToken } from '@rocket.chat/core-typings';

type PushPayload = {
	id?: string;
	type: IPushTokenTypes;
	value: string;
	appName: string;
};

export type PushEndpoints = {
	'push.token': {
		POST: (payload: PushPayload) => { result: IPushToken };
		DELETE: (payload: { token: string }) => void;
	};
	'push.get': {
		GET: (params: { id: string }) => { message: IMessage };
	};
};
