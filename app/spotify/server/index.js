import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { createSpotifyBeforeSaveMessageHandler } from '../lib/spotify';

Meteor.startup(() => {
	const beforeSaveMessage = createSpotifyBeforeSaveMessageHandler();

	callbacks.add('beforeSaveMessage', beforeSaveMessage, callbacks.priority.LOW, 'spotify-save');
});
