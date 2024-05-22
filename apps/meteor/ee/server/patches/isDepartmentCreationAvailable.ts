import { License } from '@rocket.chat/license';

import { isDepartmentCreationAvailable } from '../../../app/livechat/server/lib/isDepartmentCreationAvailable';

isDepartmentCreationAvailable.patch(async (next) => {
	// Skip the standard check when Livechat Enterprise is enabled, as it allows unlimited departments
	if (License.hasModule('livechat-enterprise')) {
		return true;
	}

	return next();
});
