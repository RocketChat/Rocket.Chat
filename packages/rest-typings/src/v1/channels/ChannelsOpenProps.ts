import { ajv } from '../../helpers/schemas';

export type ChannelsOpenProps =
	| {
			roomId: string;
			query?: string; // { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
			sort?: { ts: 1 | -1 };
	  }
	| {
			roomName: string;
			query?: string;
			sort?: { ts: 1 | -1 };
	  };

const channelsOpenPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				query: {
					type: 'string',
					nullable: true,
				},
				sort: {
					type: 'object',
					properties: {
						ts: {
							type: 'number',
							enum: [1, -1],
						},
					},
					required: ['ts'],

					additionalProperties: false,
					nullable: true,
				},
			},

			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				query: {
					type: 'string',
					nullable: true,
				},
				sort: {
					type: 'object',
					properties: {
						ts: {
							type: 'number',
							enum: [1, -1],
						},
					},
					required: ['ts'],

					additionalProperties: false,
					nullable: true,
				},
			},

			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsOpenProps = ajv.compile<ChannelsOpenProps>(channelsOpenPropsSchema);
