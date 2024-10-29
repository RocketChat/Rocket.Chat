import { useRouteParameter } from '@rocket.chat/ui-contexts';

export type AppDetailsPageTab = 'details' | 'security' | 'releases' | 'settings' | 'logs' | 'requests';

export const useAppDetailsPageTab = (): AppDetailsPageTab => {
	const tab = useRouteParameter('tab');

	switch (tab) {
		case 'details':
		case 'security':
		case 'releases':
		case 'settings':
		case 'logs':
		case 'requests':
			return tab;

		default:
			return 'details';
	}
};
