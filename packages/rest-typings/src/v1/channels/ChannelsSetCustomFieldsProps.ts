import { ajv } from '../../helpers/schemas';

export type ChannelsSetCustomFieldsProps =
	| { roomId: string; customFields: Record<string, any> }
	| { roomName: string; customFields: Record<string, any> };

const channelsSetCustomFieldsPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				customFields: {
					type: 'object',
				},
			},
			required: ['roomId', 'customFields'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				customFields: {
					type: 'object',
				},
			},
			required: ['roomName', 'customFields'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetCustomFieldsProps = ajv.compile<ChannelsSetCustomFieldsProps>(channelsSetCustomFieldsPropsSchema);
