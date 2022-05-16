import Ajv from 'ajv';

import type { IRoom } from '../../../../core-typings/dist';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv();

export type ChannelsMessagesProps = PaginatedRequest<
	| {
			roomId: IRoom['_id'];
			// query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
	  }
	| { roomName: IRoom['name'] },
	'ts'
>;

const channelsMessagesPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				query: { type: 'string' },
				count: { type: 'number' },
				offset: { type: 'number' },
				sort: {
					type: 'string',
				},
			},

			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
				query: { type: 'string' },
				count: { type: 'number' },
				offset: { type: 'number' },
				sort: {
					type: 'string',
				},
			},

			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsMessagesProps = ajv.compile<ChannelsMessagesProps>(channelsMessagesPropsSchema);
