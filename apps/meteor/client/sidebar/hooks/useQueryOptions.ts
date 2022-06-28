import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useQueryOptions = (): {
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
		  };
} => {
	const sortBy = useUserPreference('sidebarSortby');
	const showRealName = useSetting('UI_Use_Real_Name');

	return useMemo(
		() => ({
			sort: {
				...(sortBy === 'activity' && { lm: -1 }),
				...(sortBy !== 'activity' && {
					...(showRealName ? { lowerCaseFName: 1 } : { lowerCaseName: 1 }),
				}),
			},
		}),
		[sortBy, showRealName],
	);
};
