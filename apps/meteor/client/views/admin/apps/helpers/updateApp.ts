import { App, AppPermission } from '@rocket.chat/core-typings';

import { Apps } from '../../../../../app/apps/client/orchestrator';
import handleAPIError from './handleAPIError';
import warnStatusChange from './warnStatusChange';

type updateAppProps = App & {
	permissionsGranted: AppPermission[];
};

const updateApp = async ({ id, name, marketplaceVersion, permissionsGranted }: updateAppProps): Promise<void> => {
	try {
		const { status } = await Apps.updateApp(id, marketplaceVersion, permissionsGranted);
		if (status) {
			warnStatusChange(name, status);
		}
	} catch (error) {
		handleAPIError(error);
	}
};

export default updateApp;
