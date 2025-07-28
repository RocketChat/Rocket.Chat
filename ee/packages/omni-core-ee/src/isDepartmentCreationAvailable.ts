import { License } from '@rocket.chat/license';
import { isDepartmentCreationAvailable } from '@rocket.chat/omni-core';

export function isDepartmentCreationAvailablePatch(): void {
	isDepartmentCreationAvailable.patch(async (next) => {
		// Skip the standard check when Livechat Enterprise is enabled, as it allows unlimited departments
		if (License.hasModule('livechat-enterprise')) {
			return true;
		}

		return next();
	});
}
