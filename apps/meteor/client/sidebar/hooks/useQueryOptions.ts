import { OmnichannelSortingMechanismSettingType as OmniSortType } from '@rocket.chat/core-typings';
import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type QueryOptions = {
	sort:
		| {
				lm?: number | undefined;
		  }
		| {
				lowerCaseFName: number;
				lm?: number | undefined;
		  }
		| {
				lowerCaseName: number;
				lm?: number | undefined;
		  }
		| {
				priorityWeight: number;
				estimatedServiceTimeAt: number;
				ts: number;
		  };
};

const getSortOption = (sortingMechanism: OmniSortType, sortBy: string, showRealName: boolean) =>
	({
		[OmniSortType.Priority]: { priorityWeight: 1, estimatedServiceTimeAt: 1, ts: 1 },
		[OmniSortType.SLAs]: { estimatedServiceTimeAt: 1, priorityWeight: 1, ts: 1 },
		[OmniSortType.Timestamp]: {
			...(sortBy === 'activity' && { lm: -1 }),
			...(sortBy !== 'activity' && {
				...(showRealName ? { lowerCaseFName: 1 } : { lowerCaseName: 1 }),
			}),
		},
	}[sortingMechanism]);

export const useQueryOptions = (): QueryOptions => {
	const sortBy = useUserPreference('sidebarSortby') as string;
	const showRealName = useSetting('UI_Use_Real_Name') as boolean;
	const sortingMechanism = useSetting('Omnichannel_sorting_mechanism') as OmniSortType;

	return useMemo(
		() => ({
			sort: getSortOption(sortingMechanism, sortBy, showRealName),
		}),
		[showRealName, sortBy, sortingMechanism],
	);
};
