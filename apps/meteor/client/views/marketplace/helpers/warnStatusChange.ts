import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { appErroredStatuses } from './appErroredStatuses';
import { t } from '../../../../lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';

export const warnStatusChange = (appName: string, status: AppStatus): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', title: appName, message: t(`App_status_${status}`) });
		return;
	}

	dispatchToastMessage({ type: 'info', title: appName, message: t(`App_status_${status}`) });
};
