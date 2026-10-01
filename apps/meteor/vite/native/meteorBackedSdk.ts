// Vite-build stand-in for client/lib/sdk/meteorBackedSdk.ts. The transport is
// always DDPSDK here, so only the storage backend switch survives.
import { setStorageBackend } from '../../client/lib/sdk/storage';

export const FORGET_SESSION_SETTING_ID = 'Accounts_ForgetUserSessionOnWindowClose';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		[FORGET_SESSION_SETTING_ID]?: boolean;
	}
}

export const createMeteorBackedStorage = () => ({
	changeStorageBackend: () => {
		setStorageBackend(window[FORGET_SESSION_SETTING_ID] ? 'session' : 'local');
	},
});

export const createMeteorBackedSdk = (): never => {
	throw new Error('The Meteor-backed SDK does not exist in the Vite build');
};
