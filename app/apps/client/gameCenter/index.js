import { TabBar } from '../../../ui-utils/client';
import { APIClient } from '../../../utils';


(async function() {
	const data = await APIClient.get('apps');
	const activatedGames = data.apps.filter((app) =>
		app.status === 'manually_enabled'
	);

	if (activatedGames.length > 0) {
		TabBar.addButton({
			groups: ['channel', 'group', 'direct'],
			id: 'gameCenter',
			i18nTitle: 'Game Center',
			icon: 'cube',
			template: 'GameCenter',
			order: -1,
		});
	}
}());
