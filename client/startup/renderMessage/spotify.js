import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	import('../../../app/spotify/client').then(({ createSpotifyMessageRenderer }) => {
		const renderMessage = createSpotifyMessageRenderer();

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'spotify-render');
	});
});
