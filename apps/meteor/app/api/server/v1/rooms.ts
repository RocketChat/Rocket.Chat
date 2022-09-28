import { Meteor } from 'meteor/meteor';
import { ajv } from '@rocket.chat/rest-typings';

import { API } from '../api';

type GETRoomsNameExists = {
	roomName: string;
};

const GETRoomsNameExistsSchema = {
	type: 'object',
	properties: {
		roomName: {
			type: 'string',
		},
	},
	required: ['roomName'],
	additionalProperties: false,
};

export const isGETRoomsNameExists = ajv.compile<GETRoomsNameExists>(GETRoomsNameExistsSchema);

API.v1.addRoute(
	'rooms.nameExists',
	{
		authRequired: true,
		validateParams: isGETRoomsNameExists,
	},
	{
		get() {
			const { roomName } = this.queryParams;

			return API.v1.success({ exists: Meteor.call('roomNameExists', roomName) });
		},
	},
);
