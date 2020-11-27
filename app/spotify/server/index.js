import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../callbacks';
import { createSpotifyBeforeSaveMessageHandler, createSpotifyMessageRenderer } from '../lib/spotify';

Meteor.startup(() => {
	const beforeSaveMessage = createSpotifyBeforeSaveMessageHandler();
	const renderMessage = createSpotifyMessageRenderer();

	callbacks.add('beforeSaveMessage', beforeSaveMessage, callbacks.priority.LOW, 'spotify-save');
	callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'spotify-render');
});
