import { Emitter } from '@rocket.chat/emitter';

export const deviceManagementEvents = new Emitter<{
	'device-login': { userId: string; userAgent: string; clientAddress: string };
}>();
