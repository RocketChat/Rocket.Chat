import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { APIClient } from '../../../utils/client';
import { TabBar } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';

import './gameCenter.html';

Meteor.startup(function() {
	Tracker.autorun(async function() {
		if (!settings.get('Apps_Game_Center_enabled')) {
			return TabBar.removeButton('gameCenter');
		}

		const { externalComponents } = await APIClient.get('apps/externalComponents');

		if (!externalComponents.length) {
			return TabBar.removeButton('gameCenter');
		}

		TabBar.addButton({
			groups: ['channel', 'group', 'direct'],
			id: 'gameCenter',
			i18nTitle: 'Apps_Game_Center',
			icon: 'game',
			template: 'GameCenter',
			order: -1,
		});
	});
});
