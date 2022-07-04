import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsSaveNotificationParamsPOST = {
	roomId: string;
	notifications: string;
};

const RoomsSaveNotificationParamsPOSTSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		notifications: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['roomId', 'notifications'],
};

export const isRoomsSaveNotificationParamsPOST = ajv.compile<RoomsSaveNotificationParamsPOST>(RoomsSaveNotificationParamsPOSTSchema);
