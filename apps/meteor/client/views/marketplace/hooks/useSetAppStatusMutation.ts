import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { appErroredStatuses } from '../helpers/appErroredStatuses';
import { handleAPIError } from '../helpers/handleAPIError';

export const useSetAppStatusMutation = (app: App) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const setAppStatus = useEndpoint('POST', '/apps/:id/status', { id: app.id });

	return useMutation({
		mutationFn: async (status: AppStatus) => {
			const { status: updatedStatus } = await setAppStatus({ status });
			return updatedStatus;
		},
		onSuccess: (status) => {
			if (appErroredStatuses.includes(status)) {
				dispatchToastMessage({ type: 'error', message: t(`App_status_${status}`) }); // TODO: i18n
				return;
			}

			if (status === AppStatus.MANUALLY_ENABLED) {
				dispatchToastMessage({ type: 'success', message: `${app.name} enabled` }); // TODO: i18n
				return;
			}

			if (status === AppStatus.MANUALLY_DISABLED) {
				dispatchToastMessage({ type: 'success', message: `${app.name} disabled` }); // TODO: i18n
			}
		},
		onError: (error) => {
			handleAPIError(error);
		},
	});
};
