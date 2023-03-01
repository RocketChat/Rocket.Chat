import { Meteor } from 'meteor/meteor';
import Ajv from 'ajv';

import { API } from '../api';
import { eraseRoom } from '../../../../server/methods/eraseRoom';

// TO-DO: Replace this instance by only one Ajv import
const ajv = new Ajv({ coerceTypes: true });

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

API.v1.addRoute(
	'rooms.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { roomId } = this.bodyParams;

			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}

			await eraseRoom(roomId, this.userId);

			return API.v1.success();
		},
	},
);
