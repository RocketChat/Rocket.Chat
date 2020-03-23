import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { APIClient } from '../../../utils/client';
import { TabBar, TABBAR_DEFAULT_VISIBLE_ICON_COUNT } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';

import './gameCenter.html';

Meteor.startup(function() {
	Tracker.autorun(async function() {
		if (!settings.get('Apps_Game_Center_enabled')) {
			TabBar.size = TABBAR_DEFAULT_VISIBLE_ICON_COUNT;
			return TabBar.removeButton('gameCenter');
		}

		const { externalComponents } = await APIClient.get('apps/externalComponents');

		if (!externalComponents.length) {
			TabBar.size = TABBAR_DEFAULT_VISIBLE_ICON_COUNT;
			return TabBar.removeButton('gameCenter');
		}

		TabBar.size = TABBAR_DEFAULT_VISIBLE_ICON_COUNT + 1;

		TabBar.addButton({
			groups: ['channel', 'group', 'direct'],
			id: 'gameCenter',
			i18nTitle: 'Game_Center',
			icon: 'game',
			template: 'GameCenter',
			order: -1,
		});
	});
});
