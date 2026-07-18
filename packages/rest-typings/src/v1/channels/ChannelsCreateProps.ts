import { ajv } from '../Ajv';

export type ChannelsCreateProps = {
	name: string;
	members?: string[];
	teams?: string[];
	readOnly?: boolean;
	customFields?: Record<string, any>;
	extraData?: {
		broadcast?: boolean;
		encrypted?: boolean;
		teamId?: string;
		topic?: string;
		federated?: boolean;
	} & Record<string, any>;
	excludeSelf?: boolean;
};

const channelsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		members: {
			type: 'array',
		},
		teams: {
			type: 'array',
		},
		readOnly: {
			type: 'boolean',
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		excludeSelf: {
			type: 'boolean',
			nullable: true,
		},
		extraData: {
			// extraData is spread verbatim into createRoom, so it carries arbitrary room fields
			// (the create modal sends topic/broadcast/encrypted/federated). Keep it open.
			type: 'object',
			properties: {
				broadcast: {
					type: 'boolean',
				},
				encrypted: {
					type: 'boolean',
				},
				teamId: {
					type: 'string',
				},
				topic: {
					type: 'string',
				},
				federated: {
					type: 'boolean',
				},
			},
			additionalProperties: true,
			nullable: true,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isChannelsCreateProps = ajv.compile<ChannelsCreateProps>(channelsCreatePropsSchema);
