import type { IMessage, IRoom, ITeam, IGetRoomRoles, IUser, IUpload, IIntegration, ISubscription } from '@rocket.chat/core-typings';
import Ajv from 'ajv/dist/2019';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type GroupsBaseProps = ({ roomId: string } & { userId: string }) | ({ roomName: string } & { userId: string });

const withGroupBaseProperties = (properties: Record<string, any> = {}, required: string[] = []) => ({
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

type BaseProps = GroupsBaseProps;
const baseSchema = withGroupBaseProperties();
const withBaseProps = ajv.compile<GroupsInfoProps>(baseSchema);

type WithUserId = GroupsBaseProps & { userId: string };
const withUserIdSchema = withGroupBaseProperties(
	{
		userId: {
			type: 'string',
		},
	},
	['userId'],
);
const withUserIdProps = ajv.compile<WithUserId>(withUserIdSchema);

type GroupsFilesProps = PaginatedRequest<GroupsBaseProps>;

const GroupsFilesPropsSchema = withGroupBaseProperties({
	count: {
		type: 'number',
		nullable: true,
	},
	sort: {
		type: 'string',
		nullable: true,
	},
	query: {
		type: 'string',
		nullable: true,
	},
	offset: {
		type: 'number',
		nullable: true,
	},
});

export const isGroupsFilesProps = ajv.compile<GroupsFilesProps>(GroupsFilesPropsSchema);

type GroupsMembersProps = PaginatedRequest<GroupsBaseProps & { filter?: string; status?: string[] }>;

const GroupsMembersPropsSchema = withGroupBaseProperties({
	offset: {
		type: 'number',
		nullable: true,
	},
	count: {
		type: 'number',
		nullable: true,
	},
	filter: {
		type: 'string',
		nullable: true,
	},
	status: {
		type: 'array',
		items: { type: 'string' },
		nullable: true,
	},
});

export const isGroupsMembersProps = ajv.compile<GroupsMembersProps>(GroupsMembersPropsSchema);

type GroupsArchiveProps = GroupsBaseProps;

const GroupsArchivePropsSchema = withGroupBaseProperties();

export const isGroupsArchiveProps = ajv.compile<GroupsArchiveProps>(GroupsArchivePropsSchema);

type GroupsUnarchiveProps = GroupsBaseProps;

const GroupsUnarchivePropsSchema = withGroupBaseProperties();

export const isGroupsUnarchiveProps = ajv.compile<GroupsUnarchiveProps>(GroupsUnarchivePropsSchema);

type GroupsCreateProps = {
	name: string;
	members?: string[];
	customFields?: Record<string, any>;
	readOnly?: boolean;
	extraData?: {
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
			nullable: true,
		},
		readOnly: {
			type: 'boolean',
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
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
			dependentSchemas: {
				extraData: { required: ['broadcast', 'encrypted'] },
			},
			additionalProperties: false,
			nullable: true,
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isGroupsCreateProps = ajv.compile<GroupsCreateProps>(GroupsCreatePropsSchema);

type GroupsConvertToTeamProps = GroupsBaseProps;

const GroupsConvertToTeamPropsSchema = withGroupBaseProperties();

export const isGroupsConvertToTeamProps = ajv.compile<GroupsConvertToTeamProps>(GroupsConvertToTeamPropsSchema);

type GroupsCountersProps = GroupsBaseProps;

const GroupsCountersPropsSchema = withGroupBaseProperties();

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);

type GroupsCloseProps = BaseProps;

export const isGroupsCloseProps = withBaseProps;

type GroupsDeleteProps = GroupsBaseProps;

const GroupsDeletePropsSchema = withGroupBaseProperties();

export const isGroupsDeleteProps = ajv.compile<GroupsDeleteProps>(GroupsDeletePropsSchema);

type GroupsLeaveProps = GroupsBaseProps;

const GroupsLeavePropsSchema = withGroupBaseProperties();

export const isGroupsLeaveProps = ajv.compile<GroupsLeaveProps>(GroupsLeavePropsSchema);

type GroupsRolesProps = GroupsBaseProps;

const GroupsRolesPropsSchema = withGroupBaseProperties();

export const isGroupsRolesProps = ajv.compile<GroupsRolesProps>(GroupsRolesPropsSchema);

type GroupsKickProps = WithUserId;
export const isGroupsKickProps = withUserIdProps;

type GroupsMessageProps = PaginatedRequest<GroupsBaseProps>;

const GroupsMessagePropsSchema = withGroupBaseProperties({
	count: {
		type: 'number',
		nullable: true,
	},
	offset: {
		type: 'number',
		nullable: true,
	},
	sort: {
		type: 'string',
		nullable: true,
	},
	query: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsMessageProps = ajv.compile<GroupsMessageProps>(GroupsMessagePropsSchema);

export type GroupsAddAllProps = GroupsBaseProps & {
	activeUsersOnly?: 'true' | 'false' | 1 | 0;
};
const groupsAddAllPropsSchema = withGroupBaseProperties({
	activeUsersOnly: {
		type: 'boolean',
		nullable: true,
	},
});
export const isGroupsAddAllProps = ajv.compile<GroupsAddAllProps>(groupsAddAllPropsSchema);

export type GroupsAddModeratorProps = WithUserId;
export const isGroupsAddModeratorProps = withUserIdProps;

export type GroupsAddOwnerProps = WithUserId;
export const isGroupsAddOwnerProps = withUserIdProps;

export type GroupsAddLeaderProps = WithUserId;
export const isGroupsAddLeaderProps = withUserIdProps;

export type GroupsGetIntegrationsProps = GroupsBaseProps & { includeAllPrivateGroups?: 'true' | 'false' | 1 | 0 };
const groupsGetIntegrationPropsSchema = withGroupBaseProperties({
	includeAllPrivateGroups: {
		type: 'string',
		nullable: true,
	},
});
export const isGroupsGetIntegrationsProps = ajv.compile<GroupsGetIntegrationsProps>(groupsGetIntegrationPropsSchema);

export type GroupsHistoryProps = PaginatedRequest<
	GroupsBaseProps & { latest?: string; oldest?: string; inclusive?: boolean; unreads?: boolean; showThreadMessages?: string }
>;
const groupsHistoryPropsSchema = withGroupBaseProperties({
	latest: {
		type: 'string',
		nullable: true,
	},
	oldest: {
		type: 'string',
		nullable: true,
	},
	inclusive: {
		type: 'string',
		nullable: true,
	},
	unreads: {
		type: 'string',
		nullable: true,
	},
	showThreadMessages: {
		type: 'string',
		nullable: true,
	},
	count: {
		type: 'number',
		nullable: true,
	},
	offset: {
		type: 'number',
		nullable: true,
	},
	sort: {
		type: 'string',
		nullable: true,
	},
});
export const isGroupsHistoryProps = ajv.compile<GroupsHistoryProps>(groupsHistoryPropsSchema);

export type GroupsInfoProps = BaseProps;
export const isGroupsInfoProps = withBaseProps;

export type GroupsInviteProps = WithUserId;
export const isGroupsInviteProps = withUserIdProps;

export type GroupsListProps = PaginatedRequest<null>;
const groupsListPropsSchema = {};
export const isGroupsListProps = ajv.compile<GroupsListProps>(groupsListPropsSchema);

export type GroupsOnlineProps = { query?: Record<string, any> };
const groupsOnlyPropsSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};
export const isGroupsOnlineProps = ajv.compile<GroupsOnlineProps>(groupsOnlyPropsSchema);

export type GroupsOpenProps = BaseProps;
export const isGroupsOpenProps = withBaseProps;

export type GroupsRemoveModeratorProps = WithUserId;
export const isGroupsRemoveModeratorProps = withUserIdProps;

export type GroupsRemoveOwnerProps = WithUserId;
export const isGroupsRemoveOwnerProps = withUserIdProps;

export type GroupsRemoveLeaderProps = WithUserId;
export const isGroupsRemoveLeaderProps = withUserIdProps;

export type GroupsRenameProps = GroupsBaseProps & { name: string };
const groupsRenamePropsSchema = withGroupBaseProperties(
	{
		name: {
			type: 'string',
		},
	},
	['name'],
);
export const isGroupsRenameProps = ajv.compile<GroupsRenameProps>(groupsRenamePropsSchema);

export type GroupsSetCustomFieldsProps = GroupsBaseProps & { customFields: Record<string, any> };
const groupsSetCustomFieldsPropsSchema = withGroupBaseProperties(
	{
		customFields: {
			type: 'object',
		},
	},
	['customFields'],
);
export const isGroupsSetCustomFieldsProps = ajv.compile<GroupsSetCustomFieldsProps>(groupsSetCustomFieldsPropsSchema);

export type GroupsSetDescriptionProps = GroupsBaseProps & { description: string };
const groupsSetDescriptionPropsSchema = withGroupBaseProperties(
	{
		description: {
			type: 'string',
		},
	},
	['description'],
);
export const isGroupsSetDescriptionProps = ajv.compile<GroupsSetDescriptionProps>(groupsSetDescriptionPropsSchema);

export type GroupsSetPurposeProps = GroupsBaseProps & { purpose: string };
const groupsSetPurposePropsSchema = withGroupBaseProperties(
	{
		purpose: {
			type: 'string',
		},
	},
	['purpose'],
);
export const isGroupsSetPurposeProps = ajv.compile<GroupsSetPurposeProps>(groupsSetPurposePropsSchema);

export type GroupsSetReadOnlyProps = GroupsBaseProps & { readOnly: boolean };
const groupsSetReadOnlyPropsSchema = withGroupBaseProperties(
	{
		readOnly: {
			type: 'boolean',
		},
	},
	['readOnly'],
);
export const isGroupsSetReadOnlyProps = ajv.compile<GroupsSetReadOnlyProps>(groupsSetReadOnlyPropsSchema);

export type GroupsSetTopicProps = GroupsBaseProps & { topic: string };
const groupsSetTopicPropsSchema = withGroupBaseProperties(
	{
		topic: {
			type: 'string',
		},
	},
	['topic'],
);
export const isGroupsSetTopicProps = ajv.compile<GroupsSetTopicProps>(groupsSetTopicPropsSchema);

export type GroupsSetTypeProps = GroupsBaseProps & { type: string };
const groupsSetTypePropsSchema = withGroupBaseProperties(
	{
		type: {
			type: 'string',
		},
	},
	['type'],
);
export const isGroupsSetTypeProps = ajv.compile<GroupsSetTypeProps>(groupsSetTypePropsSchema);

export type GroupsSetAnnouncementProps = GroupsBaseProps & { announcement: string };
const groupsSetAnnouncementPropsSchema = withGroupBaseProperties(
	{
		announcement: {
			type: 'string',
		},
	},
	['announcement'],
);
export const isGroupsSetAnnouncementProps = ajv.compile<GroupsSetAnnouncementProps>(groupsSetAnnouncementPropsSchema);

export type GroupsModeratorsProps = BaseProps;
export const isGroupsModeratorsProps = withBaseProps;

export type GroupsSetEncryptedProps = GroupsBaseProps & { encrypted: boolean };
const groupsSetEncryptedPropsSchema = withGroupBaseProperties(
	{
		encrypted: {
			type: 'boolean',
		},
	},
	['encrypted'],
);
export const isGroupsSetEncryptedProps = ajv.compile<GroupsSetEncryptedProps>(groupsSetEncryptedPropsSchema);

export type GroupsEndpoints = {
	'/v1/groups.files': {
		GET: (params: GroupsFilesProps) => PaginatedResult<{
			files: IUpload[];
		}>;
	};
	'/v1/groups.members': {
		GET: (params: GroupsMembersProps) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'/v1/groups.history': {
		GET: (params: GroupsHistoryProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/groups.archive': {
		POST: (params: GroupsArchiveProps) => void;
	};
	'/v1/groups.unarchive': {
		POST: (params: GroupsUnarchiveProps) => void;
	};
	'/v1/groups.create': {
		POST: (params: GroupsCreateProps) => {
			group: Omit<IRoom, 'joinCode' | 'members' | 'importIds' | 'e2e'>;
		};
	};
	'/v1/groups.convertToTeam': {
		POST: (params: GroupsConvertToTeamProps) => { team: ITeam };
	};
	'/v1/groups.counters': {
		GET: (params: GroupsCountersProps) => {
			joined: boolean;
			members: number | null;
			unreads: number | null;
			unreadsFrom: Date | null;
			msgs: number | null;
			latest: Date | null;
			userMentions: number | null;
		};
	};
	'/v1/groups.close': {
		POST: (params: GroupsCloseProps) => void;
	};
	'/v1/groups.kick': {
		POST: (params: GroupsKickProps) => void;
	};
	'/v1/groups.delete': {
		POST: (params: GroupsDeleteProps) => void;
	};
	'/v1/groups.leave': {
		POST: (params: GroupsLeaveProps) => void;
	};
	'/v1/groups.roles': {
		GET: (params: GroupsRolesProps) => { roles: IGetRoomRoles[] };
	};
	'/v1/groups.messages': {
		GET: (params: GroupsMessageProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/groups.addModerator': {
		POST: (params: GroupsAddModeratorProps) => void;
	};
	'/v1/groups.removeModerator': {
		POST: (params: GroupsRemoveModeratorProps) => void;
	};
	'/v1/groups.addOwner': {
		POST: (params: GroupsAddOwnerProps) => void;
	};
	'/v1/groups.removeOwner': {
		POST: (params: GroupsRemoveOwnerProps) => void;
	};
	'/v1/groups.addLeader': {
		POST: (params: GroupsAddLeaderProps) => void;
	};
	'/v1/groups.removeLeader': {
		POST: (params: GroupsRemoveLeaderProps) => void;
	};
	'/v1/groups.addAll': {
		POST: (params: GroupsAddAllProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.getIntegrations': {
		GET: (params: GroupsGetIntegrationsProps) => {
			count: number;
			offset: number;
			integrations: IIntegration[];
			total: number;
		};
	};
	'/v1/groups.info': {
		GET: (params: GroupsInfoProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.invite': {
		POST: (params: GroupsInfoProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.list': {
		GET: (params: GroupsListProps) => {
			count: number;
			offset: number;
			groups: IRoom[];
			total: number;
		};
	};
	'/v1/groups.listAll': {
		GET: (params: GroupsListProps) => {
			count: number;
			offset: number;
			groups: IRoom[];
			total: number;
		};
	};
	'/v1/groups.online': {
		GET: (params: GroupsOnlineProps) => {
			online: Pick<IUser, '_id' | 'username'>[];
		};
	};
	'/v1/groups.open': {
		POST: (params: GroupsOpenProps) => void;
	};
	'/v1/groups.rename': {
		POST: (params: GroupsRenameProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setCustomFields': {
		POST: (params: GroupsSetCustomFieldsProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setDescription': {
		POST: (params: GroupsSetDescriptionProps) => {
			description: string;
		};
	};
	'/v1/groups.setPurpose': {
		POST: (params: GroupsSetPurposeProps) => {
			purpose: string;
		};
	};
	'/v1/groups.setReadOnly': {
		POST: (params: GroupsSetReadOnlyProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setTopic': {
		POST: (params: GroupsSetTopicProps) => {
			topic: string;
		};
	};
	'/v1/groups.setType': {
		POST: (params: GroupsSetTypeProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setAnnouncement': {
		POST: (params: GroupsSetAnnouncementProps) => {
			announcement: string;
		};
	};
	'/v1/groups.moderators': {
		GET: (params: GroupsModeratorsProps) => { moderators: ISubscription['u'][] };
	};
	'/v1/groups.setEncrypted': {
		POST: (params: GroupsSetEncryptedProps) => {
			group: IRoom;
		};
	};
};
