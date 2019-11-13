import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../ui-utils/client';
import { APIClient } from '../../../utils';
import { settings } from '../../../settings';

import './gameCenter.html';

Meteor.startup(async function() {
	const { externalComponents } = await APIClient.get('apps/externalComponents');
	const isGameCenterEnabled = settings.get('Apps_Game_Center_enabled');

	if (isGameCenterEnabled && externalComponents.length > 0) {
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
