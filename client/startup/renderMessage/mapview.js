import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const options = {
			googleMapsApiKey: settings.get('MapView_GMapsAPIKey'),
		};

		import('../../../app/mapview/client').then(({ createMapViewMessageRenderer }) => {
			const renderMessage = createMapViewMessageRenderer(options);
			callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'mapview');
		});
	});
});
