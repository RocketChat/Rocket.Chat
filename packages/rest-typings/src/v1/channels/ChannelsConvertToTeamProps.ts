import type { IRoom } from '@rocket.chat/core-typings';
import { ajv } from './../Ajv';

export type ChannelsConvertToTeamProps =
	| { channelId: IRoom['_id']; channelName?: never }
	| { channelName: Exclude<IRoom['name'], undefined>; channelId?: never };

const channelsConvertToTeamPropsSchema = {
	type: 'object',
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
