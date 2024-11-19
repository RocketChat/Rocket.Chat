import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { appErroredStatuses } from '../helpers/appErroredStatuses';
import { handleAPIError } from '../helpers/handleAPIError';
import { marketplaceQueryKeys } from '../queryKeys';

export const useSetAppStatusMutation = (app: App) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const setAppStatus = useEndpoint('POST', '/apps/:id/status', { id: app.id });

	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (status: AppStatus) => {
			const { status: updatedStatus } = await setAppStatus({ status });
			return updatedStatus;
		},
		onMutate: (status) => {
			const previous:
				| {
						marketplace: App[];
						installed: App[];
						private: App[];
				  }
				| undefined = queryClient.getQueryData(marketplaceQueryKeys.apps({ canManageApps: true }));

			if (!previous) {
				return;
			}

			queryClient.setQueryData(marketplaceQueryKeys.apps({ canManageApps: true }), {
				marketplace: previous.marketplace,
				installed: previous.installed.map((_app) => (_app.id === app.id ? { ..._app, status } : _app)),
				private: previous.private.map((_app) => (_app.id === app.id ? { ..._app, status } : _app)),
			});

			return () => queryClient.setQueryData(marketplaceQueryKeys.apps({ canManageApps: true }), previous);
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
		onError: (error, _status, revert) => {
			handleAPIError(error);
			revert?.();
		},
		onSettled: () => {
			queryClient.invalidateQueries(marketplaceQueryKeys.apps({ canManageApps: true }));
		},
	});
};
