import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	import('../../../app/spotify/client').then(({ createSpotifyBeforeSaveMessageHandler }) => {
		const beforeSaveMessage = createSpotifyBeforeSaveMessageHandler();
		callbacks.add('beforeSaveMessage', beforeSaveMessage, callbacks.priority.LOW, 'spotify-save');
	});
});
