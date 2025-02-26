import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { appErroredStatuses } from './appErroredStatuses';
import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';

export const warnEnableDisableApp = (appName: string, status: AppStatus, type: string): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	if (type === 'enable') {
		dispatchToastMessage({ type: 'success', message: `${appName} enabled` });
		return;
	}

	dispatchToastMessage({ type: 'success', message: `${appName} disabled` });
};
