// import { Meteor } from 'meteor/meteor';
import Ajv from 'ajv';

// import { API } from '../api';

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

console.log('TESTE: -------> teste no rooms_exists');

/*
API.v1.addRoute(
	'rooms.nameExists',
	{
		authRequired: true,
		validateParams: isGETRoomsNameExists,
	},
	{
		get() {
			console.log('conseguiu chegar no get() do rooms_exists');

			const { roomName } = this.queryParams;

			console.log(`consegui obter o roomName: ${roomName}`);

			return API.v1.success(Meteor.call('roomNameExists', roomName));
		},
	},
);
*/
