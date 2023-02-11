import type { App, AppPermission } from '@rocket.chat/core-typings';

import { Apps } from '../../../../../app/apps/client/orchestrator';
import { handleAPIError, warnStatusChange } from '../helpers';

type updateAppProps = App & {
	permissionsGranted: AppPermission[];
};

export const updateApp = async ({ id, name, marketplaceVersion, permissionsGranted }: updateAppProps): Promise<void> => {
	try {
		const { status } = await Apps.updateApp(id, marketplaceVersion, permissionsGranted);
		if (status) {
			warnStatusChange(name, status);
		}
	} catch (error) {
		handleAPIError(error);
	}
};
