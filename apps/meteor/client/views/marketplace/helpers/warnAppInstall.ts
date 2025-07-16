import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { appErroredStatuses } from './appErroredStatuses';
import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';

export const warnAppInstall = (appName: string, status: AppStatus): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	dispatchToastMessage({ type: 'success', message: `${appName} installed` });
};
