import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../ui-utils/client';
import { APIClient } from '../../../utils';

Meteor.startup(async function() {
	const { games } = await APIClient.get('apps/games');

	if (games.length > 0) {
		TabBar.addButton({
			groups: ['channel', 'group', 'direct'],
			id: 'gameCenter',
			i18nTitle: 'Game Center',
			icon: 'cube',
			template: 'GameCenter',
			order: -1,
		});
	}
});
