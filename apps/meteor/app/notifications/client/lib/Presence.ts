import { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Presence } from '../../../../client/lib/presence';

// TODO implement API on Streamer to be able to listen to all streamed data
// this is a hacky way to listen to all streamed data from user-presence Streamer

new Meteor.Streamer('user-presence');

type args = [username: string, statusChanged?: UserStatus, statusText?: string];

export const STATUS_MAP = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.DISABLED];

Meteor.StreamerCentral.on('stream-user-presence', (uid: string, [username, statusChanged, statusText]: args) => {
	if (!statusChanged) {
		return;
	}
	Presence.notify({ _id: uid, username, status: STATUS_MAP[statusChanged as any], statusText });
});
