import { ajv } from '../../helpers/schemas';

export type ChannelsGetIntegrationsProps =
	| { roomId: string; includeAllPublicChannels?: string }
	| { roomName: string; includeAllPublicChannels?: string };

const channelsGetIntegrationsPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				includeAllPublicChannels: {
					type: 'string',
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
				includeAllPublicChannels: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isChannelsGetIntegrationsProps = ajv.compile<ChannelsGetIntegrationsProps>(channelsGetIntegrationsPropsSchema);
