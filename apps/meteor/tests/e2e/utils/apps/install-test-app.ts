import type { BaseTest } from '../test';
import { appsEndpoint, APP_URL } from './apps-data';

/**
 * installTestApp:
 *  - Usefull to test apps functionalities
 */

export async function installTestApp(api: BaseTest['api']): Promise<void> {
	await api.post(appsEndpoint(), { url: APP_URL }, '');
}
