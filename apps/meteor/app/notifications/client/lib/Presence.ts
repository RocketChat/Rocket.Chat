import type { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Presence } from '../../../../client/lib/presence';

// TODO implement API on Streamer to be able to listen to all streamed data
// this is a hacky way to listen to all streamed data from user-presence Streamer

new Meteor.Streamer('user-presence');

Meteor.StreamerCentral.on('stream-user-presence', (uid: string, username: string, statusChanged?: UserStatus, statusText?: string) => {
	Presence.notify({ _id: uid, username, status: statusChanged, statusText });
});
