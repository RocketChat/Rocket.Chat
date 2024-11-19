import type { App, AppPermission } from '@rocket.chat/core-typings';

import { handleAPIError } from './handleAPIError';
import { warnStatusChange } from './warnStatusChange';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';

type updateAppProps = App & {
	permissionsGranted?: AppPermission[];
};

export const updateApp = async ({ id, name, marketplaceVersion, permissionsGranted }: updateAppProps): Promise<void> => {
	try {
		const { status } = await AppClientOrchestratorInstance.updateApp(id, marketplaceVersion, permissionsGranted);
		if (status) {
			warnStatusChange(name, status);
		}
	} catch (error) {
		handleAPIError(error);
	}
};
