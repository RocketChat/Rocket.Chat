import { ajv } from '../Ajv';

export type ChannelsOpenProps =
	| {
			roomId: string;
			sort?: { ts: 1 | -1 };
	  }
	| {
			roomName: string;
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
