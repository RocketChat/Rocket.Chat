import type { App, AppPermission } from '@rocket.chat/core-typings';

import { AppClientOrchestratorInstance } from '../../../../ee/client/apps/orchestrator';
import { handleAPIError, warnAppInstall } from '../helpers';

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
