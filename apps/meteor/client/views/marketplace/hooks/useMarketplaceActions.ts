import type { App, AppPermission } from '@rocket.chat/core-typings';
import { useMutation } from '@tanstack/react-query';

import { handleAPIError } from '../helpers/handleAPIError';
import { warnAppInstall } from '../helpers/warnAppInstall';
import { warnStatusChange } from '../helpers/warnStatusChange';
import { useAppsOrchestration } from './useAppsOrchestration';

type InstallAppParams = App & {
	permissionsGranted?: AppPermission[];
};

type UpdateAppParams = App & {
	permissionsGranted?: AppPermission[];
};

export const useMarketplaceActions = () => {
	const appsOrchestrator = useAppsOrchestration();

	if (!appsOrchestrator) {
		throw new Error('Apps orchestrator is not available');
	}

	const installAppMutation = useMutation(
		({ id, marketplaceVersion, permissionsGranted }: InstallAppParams) =>
			appsOrchestrator.installApp(id, marketplaceVersion, permissionsGranted),
		{
			onSuccess: ({ status }, { name }) => {
				if (!status) return;
				warnAppInstall(name, status);
			},
			onError: (error) => {
				handleAPIError(error);
			},
		},
	);

	const updateAppMutation = useMutation(
		({ id, marketplaceVersion, permissionsGranted }: UpdateAppParams) =>
			appsOrchestrator.updateApp(id, marketplaceVersion, permissionsGranted),
		{
			onSuccess: ({ status }, { name }) => {
				if (!status) return;
				warnStatusChange(name, status);
			},
			onError: (error) => {
				handleAPIError(error);
			},
		},
	);

	return {
		purchase: installAppMutation.mutateAsync,
		install: installAppMutation.mutateAsync,
		update: updateAppMutation.mutateAsync,
	} as const;
};
