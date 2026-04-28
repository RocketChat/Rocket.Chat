import { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Presence } from '../../../../client/lib/presence';
import { getDdpSdk } from '../../../../client/lib/sdk/ddpSdk';
import { createDdpSdkStreamerAdapter } from '../../../../client/lib/sdk/streamerAdapter';
import { streamerCentral } from '../../../../client/lib/streamer';

// TODO implement API on Streamer to be able to listen to all streamed data
// this is a hacky way to listen to all streamed data from user-presence Streamer

// Register the presence streamer on BOTH transports. The subscribe call in
// client/lib/presence.ts routes through DDPSDK when it's ready and falls back
// to Meteor otherwise, so the corresponding messages can arrive on either WS.
// StreamerCentral uses a per-connection `hasMeteorStreamerEventListeners` flag,
// so calling setupDdpConnection twice with distinct connection objects
// installs both listeners without duplicating within the same transport.
streamerCentral.getStreamer('user-presence', { ddpConnection: Meteor.connection });
streamerCentral.setupDdpConnection('user-presence', createDdpSdkStreamerAdapter(getDdpSdk()));

type args = [username: string, statusChanged?: UserStatus, statusText?: string];

export const STATUS_MAP = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.DISABLED];

streamerCentral.on('stream-user-presence', (uid: string, [username, statusChanged, statusText]: args) => {
	Presence.notify({ _id: uid, username, status: STATUS_MAP[statusChanged as any], statusText });
});
