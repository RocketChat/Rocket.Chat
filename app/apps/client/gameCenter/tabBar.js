import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { TabBar } from '../../../ui-utils/client';
import { settings } from '../../../settings';

import './gameCenter.html';

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (settings.get('Apps_Game_Center_enabled')) {
			return TabBar.addButton({
				groups: ['channel', 'group', 'direct'],
				id: 'gameCenter',
				i18nTitle: 'Game Center',
				icon: 'cube',
				template: 'GameCenter',
				order: -1,
			});
		}
		TabBar.removeButton('gameCenter');
	});
});
