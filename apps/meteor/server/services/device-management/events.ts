import { Emitter } from '@rocket.chat/emitter';
import type { ISocketConnection } from '@rocket.chat/core-typings';

export const deviceManagementEvents = new Emitter<{
	'device-login': { userId: string; connection: ISocketConnection };
}>();
