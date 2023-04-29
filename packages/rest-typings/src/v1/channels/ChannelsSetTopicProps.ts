import { ajv } from '../../helpers/schemas';

export type ChannelsSetTopicProps = { roomId: string; topic: string } | { roomName: string; topic: string };

const channelsSetTopicPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				topic: {
					type: 'string',
				},
			},
			required: ['roomId', 'topic'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				topic: {
					type: 'string',
				},
			},
			required: ['roomName', 'topic'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetTopicProps = ajv.compile<ChannelsSetTopicProps>(channelsSetTopicPropsSchema);
