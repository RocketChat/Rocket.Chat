
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';

// always remove the TabBar button displaying information from api.ai - we never need that
Meteor.startup(() => TabBar.removeButton('external-search'));

Tracker.autorun(() => {
	const enabled = settings.get('Assistify_AI_Enabled');
	if (enabled) {
		TabBar.addButton({
			groups: ['channel', 'group', 'live'],
			id: 'assistify-ai',
			i18nTitle: 'Knowledge_Base',
			icon: 'book',
			template: 'AssistifySmarti',
			order: 0,
		});
	} else {
		try {
			TabBar.removeButton('assistify-ai');
		} catch (err) {
			// may not exist, not an issue
		}
	}
});
