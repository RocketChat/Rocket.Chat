import { Emitter } from '@rocket.chat/emitter';
import type { DeviceLoginPayload } from '@rocket.chat/core-typings';

export const deviceManagementEvents = new Emitter<{
	'device-login': DeviceLoginPayload;
}>();
