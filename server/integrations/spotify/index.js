import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../app/callbacks';
import { createSpotifyBeforeSaveMessageHandler } from './spotify';

Meteor.startup(() => {
	const beforeSaveMessage = createSpotifyBeforeSaveMessageHandler();

	callbacks.add('beforeSaveMessage', beforeSaveMessage, callbacks.priority.LOW, 'spotify-save');
});
