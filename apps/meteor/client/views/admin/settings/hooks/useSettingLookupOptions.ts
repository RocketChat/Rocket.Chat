import type { PathPattern } from '@rocket.chat/rest-typings';
import { isRecord } from '@rocket.chat/tools';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { miscQueryKeys } from '../../../../lib/queryKeys';

export type SettingLookupEndpoint = PathPattern extends `/${infer U}` ? U : PathPattern;

export type SettingLookupOption = { key: string; label: string };

const isSettingLookupOption = (option: unknown): option is SettingLookupOption =>
	isRecord(option) && typeof option.key === 'string' && typeof option.label === 'string';

const toSettingLookupOptions = (response: unknown): SettingLookupOption[] =>
	isRecord(response) && Array.isArray(response.data) ? response.data.filter(isSettingLookupOption) : [];

export const useSettingLookupQuery = (lookupEndpoint: SettingLookupEndpoint) => {
	const lookup = useEndpoint('GET', lookupEndpoint) as unknown as () => Promise<unknown>;

	return useQuery({
		queryKey: miscQueryKeys.lookup(lookupEndpoint),
		queryFn: async () => toSettingLookupOptions(await lookup()),
	});
};

export const useSettingLookupOptions = (lookupEndpoint: SettingLookupEndpoint): SettingLookupOption[] =>
	useSettingLookupQuery(lookupEndpoint).data ?? [];
