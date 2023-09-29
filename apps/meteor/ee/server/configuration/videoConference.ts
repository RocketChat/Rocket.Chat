import { VideoConf } from '@rocket.chat/core-services';
import type { IRoom, IUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { videoConfTypes } from '../../../server/lib/videoConfTypes';
import { addSettings } from '../settings/video-conference';

Meteor.startup(async () => {
	await License.onLicense('videoconference-enterprise', async () => {
		await addSettings();

		videoConfTypes.registerVideoConferenceType(
			{ type: 'direct', status: VideoConferenceStatus.CALLING },
			async ({ _id, t }, allowRinging) => {
				if (!allowRinging || t !== 'd') {
					return false;
				}

				const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });

				return Boolean(room && (!room.uids || room.uids.length === 2));
			},
		);

		videoConfTypes.registerVideoConferenceType({ type: 'videoconference', ringing: true }, async ({ _id, t }, allowRinging) => {
			if (!allowRinging || ['l', 'v'].includes(t)) {
				return false;
			}

			if (t === 'd') {
				const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });
				if (room && (!room.uids || room.uids.length <= 2)) {
					return false;
				}
			}

			if ((await Subscriptions.findByRoomId(_id).count()) > 10) {
				return false;
			}

			return true;
		});

		callbacks.add('onJoinVideoConference', async (callId: VideoConference['_id'], userId?: IUser['_id']) =>
			VideoConf.addUser(callId, userId),
		);
	});
});
