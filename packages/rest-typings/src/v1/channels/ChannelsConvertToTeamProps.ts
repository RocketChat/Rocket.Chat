import type { IRoom } from '@rocket.chat/core-typings';

import { ajv } from '../../helpers/schemas';

export type ChannelsConvertToTeamProps =
	| { channelId: IRoom['_id']; channelName?: never }
	| { channelName: Exclude<IRoom['name'], undefined>; channelId?: never };

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
