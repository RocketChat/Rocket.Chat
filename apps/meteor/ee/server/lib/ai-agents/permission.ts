import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import type { LicenseManager } from '@rocket.chat/license';
import { Permissions } from '@rocket.chat/models';

import { MANAGE_AI_AGENTS_PERMISSION } from './constants';

/** Creates the manage AI agents permission for admins once the AI add-on is licensed, and never without it */
export const createManageAiAgentsPermissionWhenLicensed = (license: LicenseManager): void | Promise<void> =>
	license.onLicense(AI_LICENSE_MODULE, async () => {
		await Permissions.create(MANAGE_AI_AGENTS_PERMISSION, ['admin']);
	});
