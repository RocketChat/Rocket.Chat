import type { CallNotification } from '../../call';

// Server is sending a notification about the call state
export type ServerMediaSignalNotification = {
	callId: string;
	type: 'notification';

	notification: CallNotification;
};
