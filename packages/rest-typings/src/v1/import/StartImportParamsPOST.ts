import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type StartImportParamsPOST = {
	input: {
		users: [
			{
				user_id: string;
				username: string;
				email: string;
				is_deleted: boolean;
				is_bot: boolean;
				do_import: boolean;
				is_email_taken: boolean;
			},
		];
		channels: [
			{
				channel_id: string;
				name: string;
				creator?: string;
				is_archived: boolean;
				do_import: boolean;
				is_private: boolean;
				is_direct: boolean;
			},
		];
	};
};

const StartImportParamsPostSchema = {
	type: 'object',
	properties: {
		input: {
			type: 'object',
			properties: {
				users: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							user_id: { type: 'string' }, // eslint-disable-line
							username: { type: 'string' },
							email: { type: 'string', nullable: true },
							is_deleted: { type: 'boolean' }, // eslint-disable-line
							is_bot: { type: 'boolean' }, // eslint-disable-line
							do_import: { type: 'boolean' }, // eslint-disable-line
							is_email_taken: { type: 'boolean' }, // eslint-disable-line
						},
						required: ['user_id', 'username', 'is_deleted', 'is_bot', 'do_import', 'is_email_taken'],
					},
				},
				channels: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							channel_id: { type: 'string' }, // eslint-disable-line
							name: { type: 'string' },
							creator: { type: 'string' },
							is_archived: { type: 'boolean' }, // eslint-disable-line
							do_import: { type: 'boolean' }, // eslint-disable-line
							is_private: { type: 'boolean' }, // eslint-disable-line
							is_direct: { type: 'boolean' }, // eslint-disable-line
						},
						required: ['channel_id', 'name', 'is_archived', 'do_import', 'is_private', 'is_direct'],
					},
				},
			},
			required: ['users', 'channels'],
		},
	},
	additionalProperties: false,
	required: ['input'],
};

export const isStartImportParamsPOST = ajv.compile<StartImportParamsPOST>(StartImportParamsPostSchema);
