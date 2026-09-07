import { ajv } from '../Ajv';

export type GroupsCreateProps = {
	name: string;
	members?: string[];
	customFields?: Record<string, any>;
	readOnly?: boolean;
	extraData?: {
		broadcast: boolean;
		encrypted: boolean;
		teamId?: string;
	};
	excludeSelf?: boolean;
	abacAttributes?: Record<string, string[]>;
};

const GroupsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		members: {
			type: 'array',
			items: { type: 'string' },
			nullable: true,
		},
		readOnly: {
			type: 'boolean',
			nullable: true,
		},
		excludeSelf: {
			type: 'boolean',
			nullable: true,
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
		customFields: {
			type: 'object',
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
				federated: {
					type: 'boolean',
					nullable: true,
				},
				teamId: {
					type: 'string',
					nullable: true,
				},
				topic: {
					type: 'string',
					nullable: true,
				},
			},
			dependencies: {
				extraData: { required: ['broadcast', 'encrypted'] },
			},
			additionalProperties: false,
			nullable: true,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isGroupsCreateProps = ajv.compile<GroupsCreateProps>(GroupsCreatePropsSchema);
