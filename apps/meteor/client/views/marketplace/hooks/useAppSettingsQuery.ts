import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { Serialized, App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';

type UseAppSettingsQueryOptions<TData = Serialized<Record<string, ISetting>>> = Omit<
	UseQueryOptions<
		Serialized<Record<string, ISetting>>,
		Error,
		TData,
		readonly [
			'marketplace',
			'apps',
			{
				readonly appId: string;
			},
			'settings',
		]
	>,
	'queryKey' | 'queryFn'
>;

export const useAppSettingsQuery = <TData = Serialized<Record<string, ISetting>>>(
	appId: App['id'],
	options?: UseAppSettingsQueryOptions<TData>,
) => {
	const getSettings = useEndpoint('GET', '/apps/:id/settings', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', { appId }, 'settings'] as const,
		queryFn: async () => {
			const { settings } = await getSettings();

			return settings;
		},
		...options,
	});
};
