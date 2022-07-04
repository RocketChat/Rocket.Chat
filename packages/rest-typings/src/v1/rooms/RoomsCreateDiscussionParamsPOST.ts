import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsCreateDiscussionPOST = {
	prid: string;
	pmid?: string;
	t_name: string;
	users?: string[];
	encrypted?: boolean;
	reply?: string;
};

const RoomsCreateDiscussionPOSTSchema = {
	type: 'object',
	properties: {
		prid: {
			type: 'string',
		},
		pmid: {
			type: 'string',
			nullable: true,
		},
		t_name: {
			type: 'string',
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		encrypted: {
			type: 'boolean',
			nullable: true,
		},
		reply: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['prid', 't_name'],
};

export const isRoomsCreateDiscussionPOST = ajv.compile<RoomsCreateDiscussionPOST>(RoomsCreateDiscussionPOSTSchema);
