import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useQueryOptions = (): [
	{
		sort:
			| {
					lm?: -1 | 1 | undefined;
			  }
			| {
					lowerCaseFName: -1 | 1;
					lm?: -1 | 1 | undefined;
			  }
			| {
					lowerCaseName: -1 | 1;
					lm?: -1 | 1 | undefined;
			  };
	},
	<
		T extends {
			lm?: Date | undefined;
			lowerCaseFName?: string | undefined;
			lowerCaseName?: string | undefined;
		},
	>(
		el: T[],
	) => T[],
] => {
	const sortBy = useUserPreference('sidebarSortby');
	const showRealName = useSetting('UI_Use_Real_Name');

	return useMemo(
		() => [
			{
				sort: {
					...(sortBy === 'activity' && { lm: -1 }),
					...(sortBy !== 'activity' && {
						...(showRealName ? { lowerCaseFName: 1 } : { lowerCaseName: 1 }),
					}),
				},
			},
			(e) => {
				return e.sort((a, b) => {
					if (sortBy === 'activity') {
						return (b.lm?.getTime() || 0) - (a.lm?.getTime() || 0);
					}

					if (showRealName) {
						return (a.lowerCaseFName || '').localeCompare(b.lowerCaseFName || '');
					}

					return (a.lowerCaseName || '').localeCompare(b.lowerCaseName || '');
				});
			},
		],
		[sortBy, showRealName],
	);
};
