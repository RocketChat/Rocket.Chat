import { ajv } from '../../helpers/schemas';

export type ChannelsSetAnnouncementProps = { roomId: string; announcement: string } | { roomName: string; announcement: string };

const channelsSetAnnouncementPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				announcement: {
					type: 'string',
				},
			},
			required: ['roomId', 'announcement'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				announcement: {
					type: 'string',
				},
			},
			required: ['roomName', 'announcement'],
			additionalProperties: false,
		},
	],
};

export const isChannelsSetAnnouncementProps = ajv.compile<ChannelsSetAnnouncementProps>(channelsSetAnnouncementPropsSchema);
