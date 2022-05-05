import type { IMessage, IPushNotificationConfig, IPushTokenTypes, IPushToken } from '@rocket.chat/core-typings';

export type PushEndpoints = {
	'push.token': {
		POST: (payload: { id?: string; type: IPushTokenTypes; value: string; appName: string }) => { result: IPushToken };
		DELETE: (payload: { token: string }) => void;
	};
	'push.get': {
		GET: (params: { id: string }) => {
			data: {
				message: IMessage;
				notification: IPushNotificationConfig;
			};
		};
	};
};
