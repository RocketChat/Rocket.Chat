import type { App, AppPermission } from '@rocket.chat/core-typings';

import { handleAPIError } from './handleAPIError';
import { warnAppInstall } from './warnAppInstall';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';

type installAppProps = App & {
	permissionsGranted?: AppPermission[];
};

export const installApp = async ({ id, name, marketplaceVersion, permissionsGranted }: installAppProps): Promise<void> => {
	try {
		const { status } = await AppClientOrchestratorInstance.installApp(id, marketplaceVersion, permissionsGranted);
		if (status) {
			warnAppInstall(name, status);
		}
	} catch (error) {
		handleAPIError(error);
	}
};
