import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';
import { appErroredStatuses } from './appErroredStatuses';

export const warnStatusChange = (appName: string, status: AppStatus): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	dispatchToastMessage({ type: 'info', message: (t(`App_status_${status}`), appName) });
};
