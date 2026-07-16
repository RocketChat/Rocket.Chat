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
	};
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
			},
			additionalProperties: false,
			nullable: true,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isChannelsCreateProps = ajv.compile<ChannelsCreateProps>(channelsCreatePropsSchema);
