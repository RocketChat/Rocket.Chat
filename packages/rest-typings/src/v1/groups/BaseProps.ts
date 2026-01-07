import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsBaseProps = { roomId: string; roomName?: string } | { roomId?: string; roomName: string };

export const withGroupBaseProperties = (properties: Record<string, any> = {}, required: string[] = [], additionalProperties = false) => ({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				name: {
					type: 'string',
					nullable: true,
				},
				typeGroup: {
					type: 'string',
					nullable: true,
				},
				...properties,
			},
			required: ['roomId'].concat(required),
			additionalProperties,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				name: {
					type: 'string',
					nullable: true,
				},
				typeGroup: {
					type: 'string',
					nullable: true,
				},
				...properties,
			},
			required: ['roomName'].concat(required),
			additionalProperties,
		},
	],
});

export type BaseProps = GroupsBaseProps;
export const baseSchema = withGroupBaseProperties();
export const withBaseProps = ajv.compile<BaseProps>(baseSchema);

export type WithUserId = GroupsBaseProps & { userId: string };
export const withUserIdSchema = withGroupBaseProperties(
	{
		userId: {
			type: 'string',
		},
	},
	['userId'],
);
export const withUserIdProps = ajv.compile<WithUserId>(withUserIdSchema);
