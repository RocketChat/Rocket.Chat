import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { appErroredStatuses } from './appErroredStatuses';
import { t } from '../../../../lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';

export const warnEnableDisableApp = (appName: string, status: AppStatus, type: string): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', title: appName, message: t(`App_status_${status}`) });
		return;
	}

	if (type === 'enable') {
		dispatchToastMessage({ type: 'success', message: `${appName} enabled` });
		return;
	}

	dispatchToastMessage({ type: 'success', message: `${appName} disabled` });
};
