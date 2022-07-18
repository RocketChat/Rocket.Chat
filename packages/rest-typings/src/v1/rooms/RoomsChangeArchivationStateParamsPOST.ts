import { ajv } from '../../Ajv';

export type POSTChangeArchivationState = {
	rid: string;
	action?: string;
};

const POSTChangeArchivationStateSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		action: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['rid'],
};

export const isPOSTChangeArchivationState = ajv.compile<POSTChangeArchivationState>(POSTChangeArchivationStateSchema);
