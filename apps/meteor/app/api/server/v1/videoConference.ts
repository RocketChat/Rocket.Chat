import { isVideoConfStartProps } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/server';
import { API } from '../api';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { startVideoConference } from '../../../../server/lib/startVideoConference';

API.v1.addRoute(
	'video-conference/jitsi.update-timeout',
	{ authRequired: true },
	{
		post() {
			const { roomId, joiningNow = true } = this.bodyParams;
			if (!roomId) {
				return API.v1.failure('The "roomId" parameter is required!');
			}

			const room = Rooms.findOneById(roomId, { fields: { _id: 1 } });
			if (!room) {
				return API.v1.failure('Room does not exist!');
			}

			const jitsiTimeout = Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:updateTimeout', roomId, Boolean(joiningNow)));
			return API.v1.success({ jitsiTimeout });
		},
	},
);

API.v1.addRoute(
	'video-conference.start',
	{ authRequired: true, validateParams: isVideoConfStartProps },
	{
		async post() {
			const { roomId } = this.bodyParams;

			// #ToDo: Validate if there is an active provider

			const { userId } = this;

			if (!userId || !(await canAccessRoomIdAsync(roomId, userId))) {
				return API.v1.failure('invalid-params');
			}

			return API.v1.success({
				data: await startVideoConference(userId, roomId),
			});
		},
	},
);
