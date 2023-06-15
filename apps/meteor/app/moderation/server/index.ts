import { Moderation } from '@rocket.chat/core-services';

import { settings } from '../../settings/server';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

settings.watch('Trust_Roles', async (value) => {
	if (value === undefined) {
		return;
	}

	if (value) {
		await Moderation.addTrustRoles();
		addRoleEditRestriction();
		return;
	}

	await Moderation.removeTrustRoles();
});
