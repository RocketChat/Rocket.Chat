import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';

export type AppDetailsPageTab = 'details' | 'security' | 'releases' | 'settings' | 'logs' | 'requests';

export const useAppDetailsPageTab = (): [tab: AppDetailsPageTab, changeTab: (tab: AppDetailsPageTab) => void] => {
	const router = useRouter();

	const changeTab = useEffectEvent((tab: AppDetailsPageTab) => {
		router.navigate(
			{
				name: 'marketplace',
				params: { ...router.getRouteParameters(), tab },
			},
			{ replace: true },
		);
	});

	const tab = useRouteParameter('tab');

	switch (tab) {
		case 'details':
		case 'security':
		case 'releases':
		case 'settings':
		case 'logs':
		case 'requests':
			return [tab, changeTab];

		default:
			return ['details', changeTab];
	}
};
