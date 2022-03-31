import type { IRole } from '@rocket.chat/core-typings';
// import Ajv, { JSONSchemaType } from 'ajv';

// const ajv = new Ajv();

export type TeamsUpdateMemberProps = ({ teamId: string } | { teamName: string }) & {
	member: {
		userId: string;
		roles?: Array<IRole['_id']> | null;
	};
};

// const teamsUpdateMemberPropsSchema: JSONSchemaType<TeamsUpdateMemberProps> = {
// 	oneOf: [
// 		{
// 			type: 'object',
// 			properties: {
// 				teamId: {
// 					type: 'string',
// 				},
// 				member: {
// 					type: 'object',
// 					properties: {
// 						userId: {
// 							type: 'string',
// 						},
// 						roles: {
// 							type: 'array',
// 							items: {
// 								type: 'string',
// 							},
// 							nullable: true,
// 						},
// 					},
// 					required: ['userId'],
// 					additionalProperties: false,
// 				},
// 			},
// 			required: ['teamId', 'member'],
// 			additionalProperties: false,
// 		},
// 		{
// 			type: 'object',
// 			properties: {
// 				teamName: {
// 					type: 'string',
// 				},
// 				member: {
// 					type: 'object',
// 					properties: {
// 						userId: {
// 							type: 'string',
// 						},
// 						roles: {
// 							type: 'array',
// 							items: {
// 								type: 'string',
// 							},
// 							nullable: true,
// 						},
// 					},
// 					required: ['userId'],
// 					additionalProperties: false,
// 				},
// 			},
// 			required: ['teamName', 'member'],
// 			additionalProperties: false,
// 		},
// 	],
// };

// export const isTeamsUpdateMemberProps = ajv.compile(teamsUpdateMemberPropsSchema);
