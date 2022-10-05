import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type AddPermissionProps = {
	permissionId: string;
	roleId: string;
};

const AddPermissionPropsSchema = {
	type: 'object',
	properties: {
		permissionId: {
			type: 'string',
		},
		roleId: {
			type: 'string',
		},
	},
	required: ['permissionId', 'roleId'],
	additionalProperties: false,
};

export const isAddPermissionProps = ajv.compile<AddPermissionProps>(AddPermissionPropsSchema);

export type AuthorizationEndpoints = {
	'/v1/authorization.addPermission': {
		POST: (params: AddPermissionProps) => void;
	};
};
