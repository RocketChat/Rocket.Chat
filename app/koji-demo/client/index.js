import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { TabBar } from '../../ui-utils/client';

import './views/koji-demo.html';

TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'koji',
	i18nTitle: 'Koji',
	icon: 'cube',
	template: 'KojiDemo',
	order: 0,
});

Meteor.startup(function() {
	// Below is an example of what a bridge between RC and an oembed iFrame might look like
	//
	// There are a lot of decisions required to make this viable -- mostly relating to
	// permissions/authorization. We wouldn't want anyone to be able to paste a link that
	// could suddenly take control of the channel / suck out channel metadata. For the Koji
	// games in particular, it would be nice if an authorized iframe could get:
	// 		- a list of usernames/uids in the channel
	// 		- the uid of the current user
	// 		- a callback for storing data inside the channel, similar to the browser's localStorage
	//
	// Also note that I'm not familiar enough with RC's high-level structure to know the best place
	// for this listener, this was just the easiest place to get it working for the point of demo :)
	window.addEventListener('message', ({ data, source }) => {
		if (!data.hasOwnProperty('rcEmbeddedSdk')) {
			return;
		}

		try {
			// Some general metadata to demonstrate sending information
			// back on a `connect` message
			const { username } = Meteor.user();
			const { name: roomName } = Session.get(`roomData${ Session.get('openedRoom') }`);

			const { action } = data.rcEmbeddedSdk;
			// ack the successful connect back to the iframe
			if (action === 'connect') {
				source.postMessage({
					rcEmbeddedSdk: {
						version: '0.0.1',
						action: 'connected',
						connected: {
							username,
							roomName,
						},
					},
				}, '*');
			}
		} catch (err) {
			console.error(err);
		}
	}, false);
});
