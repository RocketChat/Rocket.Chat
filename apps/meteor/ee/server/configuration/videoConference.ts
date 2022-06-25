import { Meteor } from 'meteor/meteor';
import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { onLicense } from '../../app/license/server';
import { videoConfTypes } from '../../../server/lib/videoConfTypes';
import { addSettings } from '../settings/video-conference';

Meteor.startup(() =>
	onLicense('videoconference-enterprise', () => {
		addSettings();

		videoConfTypes.registerVideoConferenceType('direct', async ({ _id, t }, allowRinging) => {
			if (!allowRinging || t !== 'd') {
				return false;
			}

			const room = await Rooms.findOneById<Pick<IRoom, 'uids'>>(_id, { projection: { uids: 1 } });

			return Boolean(room && (!room.uids || room.uids.length <= 2));
		});
	}),
);
