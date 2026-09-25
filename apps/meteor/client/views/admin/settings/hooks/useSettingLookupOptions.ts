import type { PathPattern } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { miscQueryKeys } from '../../../../lib/queryKeys';

export type SettingLookupEndpoint = PathPattern extends `/${infer U}` ? U : PathPattern;

export type SettingLookupOption = { key: string; label: string };

export const useSettingLookupOptions = (lookupEndpoint: SettingLookupEndpoint): SettingLookupOption[] => {
	const lookup = useEndpoint('GET', lookupEndpoint) as unknown as () => Promise<{ data: SettingLookupOption[] }>;

	const { data: options = [] } = useQuery({
		queryKey: miscQueryKeys.lookup(lookupEndpoint),
		queryFn: async () => {
			const { data = [] } = (await lookup()) ?? {};
			return data;
		},
	});

	return options;
};
