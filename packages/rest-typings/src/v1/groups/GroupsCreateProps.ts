import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsCreateProps = {
	name: string;
	members: string[];
	readOnly: boolean;
	extraData: {
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
		},
		readOnly: {
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
					nullable: true,
				},
			},
			required: ['broadcast', 'encrypted'],
			additionalProperties: false,
		},
	},
	required: ['name', 'members', 'readOnly', 'extraData'],
	additionalProperties: false,
};

export const isGroupsCreateProps = ajv.compile<GroupsCreateProps>(GroupsCreatePropsSchema);
