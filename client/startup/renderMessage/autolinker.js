import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('AutoLinker') === true;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'autolinker');
			return;
		}

		const options = {
			stripPrefix: settings.get('AutoLinker_StripPrefix'),
			urls: {
				schemeMatches: settings.get('AutoLinker_Urls_Scheme'),
				wwwMatches: settings.get('AutoLinker_Urls_www'),
				tldMatches: settings.get('AutoLinker_Urls_TLD'),
			},
			email: settings.get('AutoLinker_Email'),
			phone: settings.get('AutoLinker_Phone'),
		};

		import('../../../app/autolinker/client').then(({ createAutolinkerMessageRenderer }) => {
			const renderMessage = createAutolinkerMessageRenderer(options);
			callbacks.remove('renderMessage', 'autolinker');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'autolinker');
		});
	});
});
