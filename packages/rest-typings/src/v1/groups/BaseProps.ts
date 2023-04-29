import { ajv } from '../../helpers/schemas';

export type GroupsBaseProps = { roomId: string } | { roomName: string };

export const withGroupBaseProperties = (properties: Record<string, any> = {}, required: string[] = []) => ({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				...properties,
			},
			required: ['roomId'].concat(required),
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
				...properties,
			},
			required: ['roomName'].concat(required),
			additionalProperties: false,
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
