import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { TabBar } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';


Meteor.startup(function() {
	Tracker.autorun(function() {
		if (!settings.get('Omnichannel_External_Frame_Enabled')) {
			return TabBar.removeButton('omnichannelExternalFrame');
		}

		TabBar.addButton({
			groups: ['live'],
			id: 'omnichannelExternalFrame',
			i18nTitle: 'Omnichannel_External_Frame',
			icon: 'cube',
			template: 'ExternalFrameContainer',
			order: -1,
		});
	});
});
