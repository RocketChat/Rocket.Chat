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
	abacAttributes?: Record<string, string[]>;
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
		abacAttributes: {
			// ABAC-P4 M4 — attribute key → values. Supplied at creation so a room is never briefly
			// locked between being created and being given its attributes. Deliberately top-level
			// rather than inside `extraData`, which is closed precisely to stop callers writing room
			// fields directly: these are validated against the caller's authority before the insert.
			type: 'object',
			propertyNames: { type: 'string', pattern: '^[A-Za-z0-9_-]+$' },
			maxProperties: 10,
			additionalProperties: {
				type: 'array',
				items: { type: 'string', minLength: 1, pattern: '^[A-Za-z0-9_-]+$' },
				maxItems: 10,
				uniqueItems: true,
			},
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
