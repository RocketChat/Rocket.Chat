import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { OTR } from './rocketchat.otr';
import { settings } from '../../settings';
import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (settings.get('OTR_Enable') && window.crypto) {
			OTR.crypto = window.crypto.subtle || window.crypto.webkitSubtle;
			OTR.enabled.set(true);
			TabBar.addButton({
				groups: ['direct'],
				id: 'otr',
				i18nTitle: 'OTR',
				icon: 'key',
				template: 'otrFlexTab',
				order: 11,
			});
		} else {
			OTR.enabled.set(false);
			TabBar.removeButton('otr');
		}
	});
});
