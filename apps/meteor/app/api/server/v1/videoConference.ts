import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/server';
import { API } from '../api';

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
