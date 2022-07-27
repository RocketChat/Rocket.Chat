import { Meteor } from 'meteor/meteor';

import { API } from '../api';

API.v1.addRoute(
	'rooms.nameExists',
    {
        authRequired: true,
        validate...
    },
	{
		get() {
			const { roomName } = this.queryParams;

			return API.v1.success(Meteor.call('rooms.nameExists', roomName));
		},
	},
);
