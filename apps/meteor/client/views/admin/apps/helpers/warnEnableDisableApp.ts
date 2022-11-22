import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { t } from '../../../../../app/utils/client';
import { dispatchToastMessage } from '../../../../lib/toast';
import appErroredStatuses from '../utils/appErroredStatuses';

const warnEnableDisableApp = (appName: string, status: AppStatus, type: string): void => {
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

export default warnEnableDisableApp;
