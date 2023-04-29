import { ajv } from '../../helpers/schemas';

export type ChannelsCreateProps = {
	name: string;
	members?: string[];
	teams?: string[];
	readOnly?: boolean;
	extraData?: {
		broadcast?: boolean;
		encrypted?: boolean;
		teamId?: string;
	};
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
		readonly: {
			type: 'boolean',
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
