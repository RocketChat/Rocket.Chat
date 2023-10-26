import type { ISocketConnectionLogged } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export const deviceManagementEvents = new Emitter<{
	'device-login': { userId: string; connection: ISocketConnectionLogged };
}>();
