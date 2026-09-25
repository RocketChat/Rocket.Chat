import { ajv } from '../Ajv';
import type { AbacCreationAttributes } from '../abacCreationAttributes';
import { abacCreationAttributesSchema } from '../abacCreationAttributes';

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
	abacAttributes?: AbacCreationAttributes;
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
		customFields: {
			type: 'object',
			nullable: true,
		},
		abacAttributes: abacCreationAttributesSchema,
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
