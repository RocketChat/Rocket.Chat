import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { App, SettingValue } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { handleAPIError } from '../helpers/handleAPIError';
import { useAppQuery } from './useAppQuery';
import { useAppSettingsQuery } from './useAppSettingsQuery';
import { useAppsOrchestrator } from './useAppsOrchestrator';

export const useSaveAppSettingsMutation = (appId: App['id']) => {
	const { data: app } = useAppQuery(appId);
	const { data: settings } = useAppSettingsQuery(appId, {
		select: (data) => Object.values(data),
		enabled: app?.installed ?? false,
	});

	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const appsOrchestrator = useAppsOrchestrator();

	return useMutation({
		mutationFn: async (values: Record<string, SettingValue>) => {
			const data =
				settings?.map(({ createdAt, updatedAt, ...setting }): ISetting => {
					return {
						...setting,
						...(createdAt && { createdAt: new Date(createdAt) }),
						...(updatedAt && { updatedAt: new Date(updatedAt) }),
						value: values[setting.id],
					};
				}) ?? [];

			await appsOrchestrator.setAppSettings(appId, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['marketplace', 'apps', { appId }, 'settings']);
			dispatchToastMessage({ type: 'success', message: `${app?.name} settings saved succesfully` });
		},
		onError: (error) => handleAPIError(error),
	});
};
