import { Meteor } from 'meteor/meteor';
import Ajv from 'ajv';
import { isRoomsEraseProps } from '@rocket.chat/rest-typings';

import { API } from '../api';

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
	'rooms.erase',
	{
		authRequired: true,
		validateParams: isRoomsEraseProps,
	},
	{
		post() {
			const { rid } = this.bodyParams;

			Meteor.call('eraseRoom', rid);
			return API.v1.success();
		},
	},
);
