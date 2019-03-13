import { TAPi18n } from 'meteor/tap:i18n';
import { settings } from '/app/settings';
import { callbacks } from '/app/callbacks';
/*
 * MapView is a named function that will replace geolocation in messages with a Google Static Map
 * @param {Object} message - The message object
 */

function MapView(message) {

	// get MapView settings
	const mv_googlekey = settings.get('MapView_GMapsAPIKey');

	if (message.location) {

		// GeoJSON is reversed - ie. [lng, lat]
		const [longitude, latitude] = message.location.coordinates;

		// confirm we have an api key set, and generate the html required for the mapview
		if (mv_googlekey && mv_googlekey.length) {
			message.html = `<a href="https://maps.google.com/maps?daddr=${ latitude },${ longitude }" target="_blank"><img src="https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=250x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ mv_googlekey }" /></a>`;
		} else {
			message.html = `<a href="https://maps.google.com/maps?daddr=${ latitude },${ longitude }" target="_blank">${ TAPi18n.__('Shared_Location') }</a>`;
		}
	}

	return message;
}

callbacks.add('renderMessage', MapView, callbacks.priority.HIGH, 'mapview');
