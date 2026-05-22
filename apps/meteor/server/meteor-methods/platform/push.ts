import type { PushTokenTarget } from '@rocket.chat/core-typings';

type PushUpdateOptions = {
	id?: string;
	token: PushTokenTarget;
	authToken: string;
	appName: string;
	userId: string | null;
	metadata?: Record<string, unknown>;
};
