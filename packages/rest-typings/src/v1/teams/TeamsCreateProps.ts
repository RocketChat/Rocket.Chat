import type { ITeam, IUser, IRoom } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

type ISubscriptionExtraData = {
	open: boolean;
	ls?: Date;
	prid?: string;
	roles?: string[];
};

interface ICreateTeamRoomExtraData extends Record<string, string | boolean> {
	teamId: string;
	teamMain: boolean;
}

type ITeamCreateRoom = {
	id?: string;
	name?: IRoom['name'];
	members?: Array<string>;
	readOnly?: boolean;
	extraData?: Partial<ICreateTeamRoomExtraData>;
	options?: { nameValidationRegex?: string; creator: string; subscriptionExtra?: ISubscriptionExtraData };
};

export type TeamsCreateProps = {
	name: ITeam['name'];
	type: ITeam['type'];
	members?: IUser['_id'][];
	room: ITeamCreateRoom;
	owner?: IUser['_id'];
};

export const teamsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		type: { type: 'number', enum: Object.values(TEAM_TYPE) },
		members: { type: 'array', items: { type: 'string' } },
		owner: { type: 'string' },
		room: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				members: { type: 'array', items: { type: 'string' } },
				readOnly: { type: 'boolean' },
				extraData: {
					type: 'object',
					properties: {
						teamId: { type: 'string' },
						teamMain: { type: 'boolean' },
					},
					additionalProperties: true,
				},
				options: {
					type: 'object',
					properties: {
						nameValidationRegex: { type: 'string' },
						creator: { type: 'string' },
						subscriptionExtra: {
							type: 'object',
							properties: {
								open: { type: 'boolean' },
								ls: { type: 'string', format: 'date-time' },
								prid: { type: 'string' },
								roles: { type: 'array', items: { type: 'string' } },
							},
							required: ['open'],
						},
					},
					additionalProperties: true,
				},
			},
		},
	},
	required: ['name', 'type'],
	additionalProperties: false,
};

export const isTeamsCreateProps = ajv.compile<TeamsCreateProps>(teamsCreatePropsSchema);
