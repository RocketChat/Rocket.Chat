import { ClientSafeError } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { addOAuthService } from '../../../ee/server/lib/oauth/addOAuthService';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';

export const addOAuthServiceMethod = async (userId: string, name: string): Promise<void> => {
	if ((await hasPermissionAsync(userId, 'add-oauth-service')) !== true) {
		throw new ClientSafeError('error-action-not-allowed', 'Adding OAuth Services is not allowed', {
			method: 'addOAuthService',
			action: 'Adding_OAuth_Services',
		});
	}

	if (!License.hasModule('oauth-enterprise')) {
		throw new ClientSafeError('error-action-not-allowed', 'This is an enterprise feature', {
			method: 'addOAuthService',
			action: 'Adding_OAuth_Services',
		});
	}

	await addOAuthService(name);
};
