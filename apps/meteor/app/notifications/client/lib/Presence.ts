import { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Presence } from '../../../../client/lib/presence';
import { getDdpSdk } from '../../../../client/lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../../../../client/lib/sdk/sdkTransportEnabled';
import { createDdpSdkStreamerAdapter } from '../../../../client/lib/sdk/streamerAdapter';
import { streamerCentral } from '../../../../client/lib/streamer';

// TODO implement API on Streamer to be able to listen to all streamed data
// this is a hacky way to listen to all streamed data from user-presence Streamer

// Register the presence streamer on Meteor's connection. With the SDK transport
// flag on, *also* register on the SDK socket so presence messages arriving on
// either WS feed the same streamerCentral. With the flag off, only Meteor's
// connection is used — duplicating the registration via the meteor-backed sdk
// proxy would re-feed every frame back through streamerCentral via two paths.
streamerCentral.getStreamer('user-presence', { ddpConnection: Meteor.connection });
if (isSdkTransportEnabled()) {
	streamerCentral.setupDdpConnection('user-presence', createDdpSdkStreamerAdapter(getDdpSdk()));
}

type args = [username: string, statusChanged?: UserStatus, statusText?: string];

export const STATUS_MAP = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.DISABLED];

streamerCentral.on('stream-user-presence', (uid: string, [username, statusChanged, statusText]: args) => {
	Presence.notify({ _id: uid, username, status: STATUS_MAP[statusChanged as any], statusText });
});
