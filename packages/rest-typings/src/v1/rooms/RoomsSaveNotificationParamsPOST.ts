import { ajv } from '../../Ajv';

export type POSTSaveNotification = {
	roomId: string;
	notifications: string;
};

const POSTSaveNotificationSchema = {
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

export const isPOSTSaveNotification = ajv.compile<POSTSaveNotification>(POSTSaveNotificationSchema);
