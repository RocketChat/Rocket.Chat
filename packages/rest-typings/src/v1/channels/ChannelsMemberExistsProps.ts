import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsMemberExistsProps = { roomId: string; username: string };

const channelsMemberExistsPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		username: {
			type: 'string',
		},
	},
	required: ['roomId', 'username'],
	additionalProperties: false,
};

export const isChannelsMemberExistsProps = ajv.compile<ChannelsMemberExistsProps>(channelsMemberExistsPropsSchema);
