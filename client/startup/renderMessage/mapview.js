import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const { createMapViewMessageRenderer } = await import('../../../app/mapview/client');

		const renderMessage = createMapViewMessageRenderer({
			googleMapsApiKey: settings.get('MapView_GMapsAPIKey'),
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH, 'mapview');
	});
});
