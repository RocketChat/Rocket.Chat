import type { BaseTest } from '../test';
import { appsEndpoint } from './apps-data';

/**
 * removeAppById:
 *  - This helper remove the desirable app from the workspace
 */

export const removeAppById = async (api: BaseTest['api'], id: string) => {
	await api.delete(appsEndpoint(`/${id}`), '');
};
