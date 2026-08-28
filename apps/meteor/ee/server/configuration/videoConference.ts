import { VideoConf } from '@rocket.chat/core-services';
import type { IRoom, IUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../server/lib/callbacks';
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

		// Ringing on start is for the rooms where every member is someone who chose to be in a conversation
		// with the caller: a DM, handled by the `direct` type above, and a group DM, handled here. Starting a
		// call in a channel, private group or team does not ring anyone — the people who want in are told by
		// the call itself, and whoever else wants to reach a specific person can ring them from the call.
		videoConfTypes.registerVideoConferenceType({ type: 'videoconference', ringing: true }, async ({ _id, t }, allowRinging) => {
			if (!allowRinging || t !== 'd') {
				return false;
			}

			// A two-person DM is the `direct` type's, so what rings here is a group DM.
			const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });

			return Boolean(room?.uids && room.uids.length > 2);
		});

		callbacks.add('onJoinVideoConference', async (callId: VideoConference['_id'], userId?: IUser['_id']) =>
			VideoConf.addUser(callId, userId),
		);
	});
});
