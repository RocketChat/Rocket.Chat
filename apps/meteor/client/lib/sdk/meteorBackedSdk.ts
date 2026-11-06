// The transport is always DDPSDK, so only the storage backend switch remains.
import { setStorageBackend } from './storage';

export const FORGET_SESSION_SETTING_ID = 'Accounts_ForgetUserSessionOnWindowClose';

declare global {
	interface Window {
		[FORGET_SESSION_SETTING_ID]?: boolean;
	}
}

declare module '@rocket.chat/ddp-client' {
	interface DDPSDK {
		storage: {
			changeStorageBackend: () => void;
		};
	}
}

export const createMeteorBackedStorage = () => ({
	changeStorageBackend: () => {
		const backend = window[FORGET_SESSION_SETTING_ID] ? 'session' : 'local';
		// The caller records the backend as applied unless this throws, so a failed switch is retried later.
		if (!setStorageBackend(backend)) {
			throw new Error(`Could not move the login to the ${backend} storage`);
		}
	},
});
