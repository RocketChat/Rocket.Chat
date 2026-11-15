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
			items: { type: 'string' },
		},
		teams: {
			type: 'array',
			items: { type: 'string' },
		},
		readOnly: {
			type: 'boolean',
		},
		customFields: {
			type: 'object',
		},
		excludeSelf: {
			type: 'boolean',
		},
		extraData: {
			// extraData is spread verbatim into createRoom. Keep it closed (additionalProperties: false)
			// so callers can't inject arbitrary room fields (default/featured/retention/abacAttributes/...).
			// The create modal only sends the fields declared below.
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
			additionalProperties: false,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isChannelsCreateProps = ajv.compile<ChannelsCreateProps>(channelsCreatePropsSchema);
