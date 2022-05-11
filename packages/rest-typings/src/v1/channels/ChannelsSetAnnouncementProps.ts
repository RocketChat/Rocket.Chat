import Ajv from 'ajv';

const ajv = new Ajv();

export type ChannelsSetAnnouncementProps = { roomId: string; announcement: string };

const channelsSetAnnouncementPropsSchema = {
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
};

export const isChannelsSetAnnouncementProps = ajv.compile<ChannelsSetAnnouncementProps>(channelsSetAnnouncementPropsSchema);
