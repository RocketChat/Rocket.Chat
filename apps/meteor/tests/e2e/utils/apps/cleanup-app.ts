import { APP_ID } from './apps-data';
import type { BaseTest } from '../test';
import { removeAppById } from './remove-app';

/**
 * cleanupApp:
 *  - This helper remove the tester app from the workspace
 */

export const cleanupTesterApp = async (api: BaseTest['api']) => {
	await removeAppById(api, APP_ID);
};
