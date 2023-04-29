import { ajv } from '../../helpers/schemas';

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
			required: ['broadcast', 'encrypted'],
			additionalProperties: false,
			nullable: true,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isGroupsCreateProps = ajv.compile<GroupsCreateProps>(GroupsCreatePropsSchema);
