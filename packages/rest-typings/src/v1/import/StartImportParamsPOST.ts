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
							// eslint-disable-next-line @typescript-eslint/camelcase
							user_id: { type: 'string' },
							username: { type: 'string' },
							email: { type: 'string' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							is_deleted: { type: 'boolean' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							is_bot: { type: 'boolean' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							do_import: { type: 'boolean' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							is_email_taken: { type: 'boolean' },
						},
						required: ['user_id', 'username', 'email', 'is_deleted', 'is_bot', 'do_import', 'is_email_taken'],
					},
				},
				channels: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							// eslint-disable-next-line @typescript-eslint/camelcase
							channel_id: { type: 'string' },
							name: { type: 'string' },
							creator: { type: 'string' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							is_archived: { type: 'boolean' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							do_import: { type: 'boolean' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							is_private: { type: 'boolean' },
							// eslint-disable-next-line @typescript-eslint/camelcase
							is_direct: { type: 'boolean' },
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
