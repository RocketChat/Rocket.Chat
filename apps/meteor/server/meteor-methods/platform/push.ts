import type { IPushToken } from '@rocket.chat/core-typings';


type PushUpdateOptions = {
	id?: string;
	token: IPushToken['token'];
	authToken: string;
	appName: string;
	userId: string | null;
	metadata?: Record<string, unknown>;
};
