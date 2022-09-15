import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsConvertToTeamProps = { channelId: string; channelName: string };

const channelsConvertToTeamPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				channelId: { type: 'string' },
			},
			required: ['channelId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				channelName: { type: 'string' },
			},
			required: ['channelName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsConvertToTeamProps = ajv.compile<ChannelsConvertToTeamProps>(channelsConvertToTeamPropsSchema);
