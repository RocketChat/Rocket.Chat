import type {
	IOmnichannelCannedResponse,
	ILivechatAgent,
	ILivechatDepartment,
	ILivechatDepartmentAgents,
	ILivechatMonitor,
	ILivechatTag,
	ILivechatVisitor,
	ILivechatVisitorDTO,
	IMessage,
	IOmnichannelRoom,
	IOmnichannelRoomWithDepartment,
	IRoom,
	ISetting,
	ILivechatAgentActivity,
	ILivechatCustomField,
	IOmnichannelSystemMessage,
	Serialized,
	ILivechatBusinessHour,
	ILivechatTrigger,
	ILivechatInquiryRecord,
	IOmnichannelServiceLevelAgreements,
	ILivechatPriority,
	LivechatDepartmentDTO,
	ILivechatTriggerCondition,
	ILivechatTriggerAction,
	ReportResult,
	ReportWithUnmatchingElements,
	SMSProviderResponse,
	ILivechatTriggerActionResponse,
	ILivechatContact,
	ILivechatContactChannel,
	IUser,
} from '@rocket.chat/core-typings';
import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import type { WithId } from 'mongodb';

import { ajv } from './Ajv';
import type { Deprecated } from '../helpers/Deprecated';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type booleanString = 'true' | 'false';

type LivechatVisitorsInfo = {
	visitorId: string;
};

const LivechatVisitorsInfoSchema = {
	type: 'object',
	properties: {
		visitorId: {
			type: 'string',
		},
	},
	required: ['visitorId'],
	additionalProperties: false,
};

export const isLivechatVisitorsInfoProps = ajv.compile<LivechatVisitorsInfo>(LivechatVisitorsInfoSchema);

type LivechatRoomOnHold = {
	roomId: IRoom['_id'];
};

const LivechatRoomOnHoldSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isLivechatRoomOnHoldProps = ajv.compile<LivechatRoomOnHold>(LivechatRoomOnHoldSchema);

type LivechatRoomResumeOnHold = {
	roomId: IRoom['_id'];
};

const LivechatRoomResumeOnHoldSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isLivechatRoomResumeOnHoldProps = ajv.compile<LivechatRoomResumeOnHold>(LivechatRoomResumeOnHoldSchema);

type LivechatDepartmentId = {
	onlyMyDepartments?: booleanString;
	includeAgents?: booleanString;
};

const LivechatDepartmentIdSchema = {
	type: 'object',
	properties: {
		onlyMyDepartments: {
			type: 'string',
			nullable: true,
		},
		includeAgents: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isLivechatDepartmentIdProps = ajv.compile<LivechatDepartmentId>(LivechatDepartmentIdSchema);

type LivechatDepartmentAutocomplete = {
	selector: string;
	onlyMyDepartments: booleanString;
	showArchived?: booleanString;
};

const LivechatDepartmentAutocompleteSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
		onlyMyDepartments: {
			type: 'string',
		},
		showArchived: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['selector', 'onlyMyDepartments'],
	additionalProperties: false,
};

export const isLivechatDepartmentAutocompleteProps = ajv.compile<LivechatDepartmentAutocomplete>(LivechatDepartmentAutocompleteSchema);

type LivechatDepartmentDepartmentIdAgentsGET = {
	sort: string;
};

const LivechatDepartmentDepartmentIdAgentsGETSchema = {
	type: 'object',
	properties: {
		sort: {
			type: 'string',
		},
	},
	required: ['sort'],
	additionalProperties: false,
};

export const isLivechatDepartmentDepartmentIdAgentsGETProps = ajv.compile<LivechatDepartmentDepartmentIdAgentsGET>(
	LivechatDepartmentDepartmentIdAgentsGETSchema,
);

type LivechatDepartmentDepartmentIdAgentsPOST = {
	upsert: { agentId: string; username: string; count: number; order: number }[];
	remove: { agentId: string; username: string; count: number; order: number }[];
};

const LivechatDepartmentDepartmentIdAgentsPOSTSchema = {
	type: 'object',
	properties: {
		upsert: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		remove: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['upsert', 'remove'],
	additionalProperties: false,
};

export const isLivechatDepartmentDepartmentIdAgentsPOSTProps = ajv.compile<LivechatDepartmentDepartmentIdAgentsPOST>(
	LivechatDepartmentDepartmentIdAgentsPOSTSchema,
);

type LivechatVisitorTokenGet = {
	token: string;
};

const LivechatVisitorTokenGetSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatVisitorTokenGetProps = ajv.compile<LivechatVisitorTokenGet>(LivechatVisitorTokenGetSchema);

type LivechatVisitorTokenDelete = {
	token: string;
};

const LivechatVisitorTokenDeleteSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatVisitorTokenDeleteProps = ajv.compile<LivechatVisitorTokenDelete>(LivechatVisitorTokenDeleteSchema);

type LivechatVisitorTokenRoom = {
	token: string;
};

const LivechatVisitorTokenRoomSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatVisitorTokenRoomProps = ajv.compile<LivechatVisitorTokenRoom>(LivechatVisitorTokenRoomSchema);

type LivechatVisitorCallStatus = {
	token: string;
	callStatus: string;
	rid: string;
	callId: string;
};

const LivechatVisitorCallStatusSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		callStatus: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		callId: {
			type: 'string',
		},
	},
	required: ['token', 'callStatus', 'rid', 'callId'],
	additionalProperties: false,
};

export const isLivechatVisitorCallStatusProps = ajv.compile<LivechatVisitorCallStatus>(LivechatVisitorCallStatusSchema);

type LivechatVisitorStatus = {
	token: string;
	status: string;
};

const LivechatVisitorStatusSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		status: {
			type: 'string',
		},
	},
	required: ['token', 'status'],
	additionalProperties: false,
};

export const isLivechatVisitorStatusProps = ajv.compile<LivechatVisitorStatus>(LivechatVisitorStatusSchema);

type LiveChatRoomJoin = {
	roomId: string;
};

const LiveChatRoomJoinSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isLiveChatRoomJoinProps = ajv.compile<LiveChatRoomJoin>(LiveChatRoomJoinSchema);

type LiveChatRoomForward = {
	roomId: string;
	userId?: string;
	departmentId?: string;
	comment?: string;
	clientAction?: boolean;
};

const LiveChatRoomForwardSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
		comment: {
			type: 'string',
			nullable: true,
		},
		clientAction: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isLiveChatRoomForwardProps = ajv.compile<LiveChatRoomForward>(LiveChatRoomForwardSchema);

type LiveChatRoomSaveInfo = {
	guestData: {
		_id: string;
		name?: string;
		email?: string;
		phone?: string;
		livechatData?: { [k: string]: string };
	};
	roomData: {
		_id: string;
		topic?: string;
		tags?: string[];
		livechatData?: { [k: string]: string };
		// For priority and SLA, if the value is blank (ie ""), then system will remove the priority or SLA from the room
		priorityId?: string;
		slaId?: string;
	};
};

const LiveChatRoomSaveInfoSchema = {
	type: 'object',
	properties: {
		guestData: {
			type: 'object',
			properties: {
				_id: {
					type: 'string',
				},
				name: {
					type: 'string',
					nullable: true,
				},
				email: {
					type: 'string',
					nullable: true,
				},
				phone: {
					type: 'string',
					nullable: true,
				},
				livechatData: {
					type: 'object',
					patternProperties: {
						'.*': {
							type: 'string',
						},
					},
					nullable: true,
				},
			},
			required: ['_id'],
			additionalProperties: false,
		},
		roomData: {
			type: 'object',
			properties: {
				_id: {
					type: 'string',
				},
				topic: {
					type: 'string',
					nullable: true,
				},
				tags: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				livechatData: {
					type: 'object',
					nullable: true,
				},
				priorityId: {
					type: 'string',
					nullable: true,
				},
				slaId: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['_id'],
			additionalProperties: false,
		},
	},
	required: ['guestData', 'roomData'],
	additionalProperties: false,
};

export const isLiveChatRoomSaveInfoProps = ajv.compile<LiveChatRoomSaveInfo>(LiveChatRoomSaveInfoSchema);

type LivechatMonitorsListProps = PaginatedRequest<{ text: string }>;

const LivechatMonitorsListSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['text'],
	additionalProperties: false,
};

export const isLivechatMonitorsListProps = ajv.compile<LivechatMonitorsListProps>(LivechatMonitorsListSchema);

type LivechatTagsListProps = PaginatedRequest<{ text: string; viewAll?: 'true' | 'false'; department?: string }, 'name'>;

const LivechatTagsListSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
		},
		department: {
			type: 'string',
			nullable: true,
		},
		viewAll: {
			type: 'string',
			nullable: true,
			enum: ['true', 'false'],
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['text'],
	additionalProperties: false,
};

export const isLivechatTagsListProps = ajv.compile<LivechatTagsListProps>(LivechatTagsListSchema);

type LivechatDepartmentProps = PaginatedRequest<{
	text?: string;
	onlyMyDepartments?: booleanString;
	enabled?: booleanString;
	excludeDepartmentId?: string;
	showArchived?: booleanString;
}>;

const LivechatDepartmentSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
			nullable: true,
		},
		onlyMyDepartments: {
			type: 'string',
			enum: ['true', 'false'],
			nullable: true,
		},
		enabled: {
			type: 'string',
			nullable: true,
		},
		excludeDepartmentId: {
			type: 'string',
			nullable: true,
		},
		showArchived: {
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatDepartmentProps = ajv.compile<LivechatDepartmentProps>(LivechatDepartmentSchema);

type POSTLivechatDepartmentProps = {
	department: LivechatDepartmentDTO;
	agents?: { agentId: string; count?: number; order?: number }[];
	departmentUnit?: { _id?: string };
};

const POSTLivechatDepartmentSchema = {
	type: 'object',
	properties: {
		department: {
			type: 'object',
			properties: {
				enabled: {
					type: 'boolean',
				},
				name: {
					type: 'string',
				},
				description: {
					type: 'string',
					nullable: true,
				},
				showOnRegistration: {
					type: 'boolean',
				},
				showOnOfflineForm: {
					type: 'boolean',
				},
				requestTagBeforeClosingChat: {
					type: 'boolean',
					nullable: true,
				},
				chatClosingTags: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				fallbackForwardDepartment: {
					type: 'string',
					nullable: true,
				},
				email: {
					type: 'string',
				},
				departmentsAllowedToForward: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				allowReceiveForwardOffline: {
					type: 'boolean',
					nullable: true,
				},
				offlineMessageChannelName: {
					type: 'string',
					nullable: true,
				},
				abandonedRoomsCloseCustomMessage: {
					type: 'string',
					nullable: true,
				},
				waitingQueueMessage: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['name', 'email', 'enabled', 'showOnRegistration', 'showOnOfflineForm'],
			additionalProperties: true,
		},
		agents: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					agentId: {
						type: 'string',
					},
					count: {
						type: 'number',
						nullable: true,
					},
					order: {
						type: 'number',
						nullable: true,
					},
				},
				required: ['agentId'],
				additionalProperties: false,
			},
			nullable: true,
		},
		departmentUnit: {
			type: 'object',
			properties: {
				_id: {
					type: 'string',
				},
			},
			additionalProperties: false,
		},
	},
	required: ['department'],
	additionalProperties: false,
};

export const isPOSTLivechatDepartmentProps = ajv.compile<POSTLivechatDepartmentProps>(POSTLivechatDepartmentSchema);

type LivechatDepartmentsAvailableByUnitIdProps = PaginatedRequest<{ text: string; onlyMyDepartments?: 'true' | 'false' }>;

const LivechatDepartmentsAvailableByUnitIdSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
		},
		onlyMyDepartments: {
			type: 'string',
			enum: ['true', 'false'],
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['text'],
	additionalProperties: false,
};

export const isLivechatDepartmentsAvailableByUnitIdProps = ajv.compile<LivechatDepartmentsAvailableByUnitIdProps>(
	LivechatDepartmentsAvailableByUnitIdSchema,
);

type LivechatDepartmentsByUnitProps = PaginatedRequest<{ text: string }>;

const LivechatDepartmentsByUnitSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['text'],
	additionalProperties: false,
};

export const isLivechatDepartmentsByUnitProps = ajv.compile<LivechatDepartmentsByUnitProps>(LivechatDepartmentsByUnitSchema);

type LivechatDepartmentsByUnitIdProps = PaginatedRequest;

const LivechatDepartmentsByUnitIdSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['text'],
	additionalProperties: false,
};

export const isLivechatDepartmentsByUnitIdProps = ajv.compile<LivechatDepartmentsByUnitIdProps>(LivechatDepartmentsByUnitIdSchema);

type LivechatUsersManagerGETProps = PaginatedRequest<{
	text?: string;
	fields?: string;
	onlyAvailable?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
}>;

const LivechatUsersManagerGETSchema = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
			nullable: true,
		},
		onlyAvailable: {
			type: 'boolean',
			nullable: true,
		},
		excludeId: {
			type: 'string',
			nullable: true,
		},
		showIdleAgents: {
			type: 'boolean',
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
		query: {
			type: 'string',
			nullable: true,
		},
		fields: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isLivechatUsersManagerGETProps = ajv.compile<LivechatUsersManagerGETProps>(LivechatUsersManagerGETSchema);

type LivechatUsersManagerPOSTProps = PaginatedRequest<{ username: string }>;

const LivechatUsersManagerPOSTSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isLivechatUsersManagerPOSTProps = ajv.compile<LivechatUsersManagerPOSTProps>(LivechatUsersManagerPOSTSchema);

type LivechatQueueProps = {
	agentId?: string;
	includeOfflineAgents?: booleanString;
	departmentId?: string;
	offset: number;
	count: number;
	sort: string;
};

const LivechatQueuePropsSchema = {
	type: 'object',
	properties: {
		agentId: {
			type: 'string',
			nullable: true,
		},
		includeOfflineAgents: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	required: ['count', 'offset', 'sort'],
	additionalProperties: false,
};

export const isLivechatQueueProps = ajv.compile<LivechatQueueProps>(LivechatQueuePropsSchema);

type CannedResponsesProps = PaginatedRequest<{
	scope?: string;
	departmentId?: string;
	text?: string;
	shortcut?: string;
	tags?: string[];
	createdBy?: string;
}>;

const CannedResponsesPropsSchema = {
	type: 'object',
	properties: {
		scope: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
		shortcut: {
			type: 'string',
			nullable: true,
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		createdBy: {
			type: 'string',
			nullable: true,
		},
		text: {
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
	},
	additionalProperties: false,
};

export const isCannedResponsesProps = ajv.compile<CannedResponsesProps>(CannedResponsesPropsSchema);

type LivechatCustomFieldsProps = PaginatedRequest<{ text?: string }>;

const LivechatCustomFieldsSchema = {
	type: 'object',
	properties: {
		text: {
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isLivechatCustomFieldsProps = ajv.compile<LivechatCustomFieldsProps>(LivechatCustomFieldsSchema);

export type LivechatRoomsProps = {
	roomName?: string;
	offset?: number;
	createdAt?: string;
	open?: boolean;
	agents?: string[];
	closedAt?: string;
	departmentId?: string;
	tags?: string[];
	customFields?: string;
	onhold?: boolean;
};

export type ContactSearchChatsResult = Pick<
	IOmnichannelRoom,
	| 'fname'
	| 'ts'
	| 'v'
	| 'msgs'
	| 'servedBy'
	| 'closedAt'
	| 'closedBy'
	| 'closer'
	| 'tags'
	| '_id'
	| 'closingMessage'
	| 'source'
	| 'lastMessage'
	| 'verified'
>;

export type VisitorSearchChatsResult = Pick<
	IOmnichannelRoom,
	'fname' | 'ts' | 'msgs' | 'servedBy' | 'closedAt' | 'closedBy' | 'closer' | 'tags' | '_id' | 'closingMessage'
> & { v: Omit<IOmnichannelRoom['v'], 'lastMessageTs'> };

const LivechatRoomsSchema = {
	type: 'object',
	properties: {
		guest: {
			type: 'string',
		},
		fname: {
			type: 'string',
		},
		servedBy: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		status: {
			type: 'string',
		},
		department: {
			type: 'string',
		},
		from: {
			type: 'string',
		},
		to: {
			type: 'string',
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		current: {
			type: 'number',
		},
		itemsPerPage: {
			type: 'number',
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['guest', 'fname', 'servedBy', 'status', 'department', 'from', 'to', 'current', 'itemsPerPage'],
	additionalProperties: false,
};

export const isLivechatRoomsProps = ajv.compile<LivechatRoomsProps>(LivechatRoomsSchema);

type LivechatRidMessagesProps = PaginatedRequest<{ searchTerm?: string }>;

const LivechatRidMessagesSchema = {
	type: 'object',
	properties: {
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
		searchTerm: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isLivechatRidMessagesProps = ajv.compile<LivechatRidMessagesProps>(LivechatRidMessagesSchema);

type LivechatUsersAgentProps = PaginatedRequest<{ text?: string }>;

const LivechatUsersAgentSchema = {
	type: 'object',
	properties: {
		text: {
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isLivechatUsersAgentProps = ajv.compile<LivechatUsersAgentProps>(LivechatUsersAgentSchema);

type LivechatPrioritiesProps = PaginatedRequest<{ text?: string }>;

const LivechatPrioritiesPropsSchema = {
	type: 'object',
	properties: {
		text: {
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
		query: {
			type: 'string',
			nullable: true,
		},
		fields: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isLivechatPrioritiesProps = ajv.compile<LivechatPrioritiesProps>(LivechatPrioritiesPropsSchema);

type CreateOrUpdateLivechatSlaProps = {
	name: string;
	description?: string;
	dueTimeInMinutes: number;
};

const CreateOrUpdateLivechatSlaPropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		description: {
			type: 'string',
			nullable: true,
		},
		dueTimeInMinutes: {
			type: 'number',
		},
	},
	required: ['name', 'dueTimeInMinutes'],
	additionalProperties: false,
};

export const isCreateOrUpdateLivechatSlaProps = ajv.compile<CreateOrUpdateLivechatSlaProps>(CreateOrUpdateLivechatSlaPropsSchema);

type POSTOmnichannelContactProps = {
	_id?: string;
	token: string;
	name: string;
	username?: string;
	email?: string;
	phone?: string;
	customFields?: Record<string, unknown>;
	contactManager?: {
		username: string;
	};
};

const POSTOmnichannelContactSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			nullable: true,
		},
		token: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		username: {
			type: 'string',
		},
		email: {
			type: 'string',
			nullable: true,
		},
		phone: {
			type: 'string',
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		contactManager: {
			type: 'object',
			nullable: true,
			properties: {
				username: {
					type: 'string',
				},
			},
		},
	},
	required: ['token', 'name', 'username'],
	additionalProperties: false,
};

export const isPOSTOmnichannelContactProps = ajv.compile<POSTOmnichannelContactProps>(POSTOmnichannelContactSchema);

type POSTOmnichannelContactsProps = {
	name: string;
	emails: string[];
	phones: string[];
	customFields?: Record<string, unknown>;
	contactManager?: string;
};

const POSTOmnichannelContactsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		emails: {
			type: 'array',
			items: {
				type: 'string',
			},
			uniqueItems: true,
		},
		phones: {
			type: 'array',
			items: {
				type: 'string',
			},
			uniqueItems: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		contactManager: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['name', 'emails', 'phones'],
	additionalProperties: false,
};

export const isPOSTOmnichannelContactsProps = ajv.compile<POSTOmnichannelContactsProps>(POSTOmnichannelContactsSchema);

type POSTUpdateOmnichannelContactsProps = {
	contactId: string;
	name?: string;
	emails?: string[];
	phones?: string[];
	customFields?: Record<string, unknown>;
	contactManager?: string;
	wipeConflicts?: boolean;
};

const POSTUpdateOmnichannelContactsSchema = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		emails: {
			type: 'array',
			items: {
				type: 'string',
			},
			uniqueItems: true,
			nullable: true,
		},
		phones: {
			type: 'array',
			items: {
				type: 'string',
			},
			uniqueItems: true,
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		contactManager: {
			type: 'string',
			nullable: true,
		},
		wipeConflicts: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['contactId'],
	additionalProperties: false,
};

export const isPOSTUpdateOmnichannelContactsProps = ajv.compile<POSTUpdateOmnichannelContactsProps>(POSTUpdateOmnichannelContactsSchema);

type GETOmnichannelContactsProps = { contactId?: string };

export const ContactVisitorAssociationSchema = {
	type: 'object',
	properties: {
		visitorId: {
			type: 'string',
		},
		source: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
				},
				id: {
					type: 'string',
				},
			},
			required: ['type'],
		},
	},
	nullable: false,
	required: ['visitorId', 'source'],
};

const GETOmnichannelContactsSchema = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
			nullable: false,
			isNotEmpty: true,
		},
	},
	required: ['contactId'],
	additionalProperties: false,
};

export const isGETOmnichannelContactsProps = ajv.compile<GETOmnichannelContactsProps>(GETOmnichannelContactsSchema);

type GETOmnichannelContactsSearchProps = PaginatedRequest<{
	searchText: string;
	unknown?: boolean;
}>;

const GETOmnichannelContactsSearchSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		searchText: {
			type: 'string',
		},
		unknown: {
			type: 'boolean',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isGETOmnichannelContactsSearchProps = ajv.compile<GETOmnichannelContactsSearchProps>(GETOmnichannelContactsSearchSchema);

type GETOmnichannelContactsCheckExistenceProps = {
	contactId?: string;
	email?: string;
	phone?: string;
};

const GETOmnichannelContactsCheckExistenceSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				contactId: {
					type: 'string',
					nullable: false,
					isNotEmpty: true,
				},
			},
			required: ['contactId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				email: {
					type: 'string',
					format: 'basic_email',
					nullable: false,
					isNotEmpty: true,
				},
			},
			required: ['email'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				phone: {
					type: 'string',
					nullable: false,
					isNotEmpty: true,
				},
			},
			required: ['phone'],
			additionalProperties: false,
		},
	],
};

export const isGETOmnichannelContactsCheckExistenceProps = ajv.compile<GETOmnichannelContactsCheckExistenceProps>(
	GETOmnichannelContactsCheckExistenceSchema,
);

type GETOmnichannelContactHistoryProps = PaginatedRequest<{
	contactId: string;
	source?: string;
}>;

const GETOmnichannelContactHistorySchema = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
		},
		source: {
			type: 'string',
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	required: ['contactId'],
	additionalProperties: false,
};

export const isGETOmnichannelContactHistoryProps = ajv.compile<GETOmnichannelContactHistoryProps>(GETOmnichannelContactHistorySchema);

type GETOmnichannelContactsChannelsProps = {
	contactId: string;
};

const GETOmnichannelContactsChannelsSchema = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
		},
	},
	required: ['contactId'],
	additionalProperties: false,
};

export const isGETOmnichannelContactsChannelsProps = ajv.compile<GETOmnichannelContactsChannelsProps>(GETOmnichannelContactsChannelsSchema);

type GETOmnichannelContactProps = { contactId: string };

const GETOmnichannelContactSchema = {
	type: 'object',
	properties: {
		contactId: {
			type: 'string',
		},
	},
	required: ['contactId'],
	additionalProperties: false,
};

export const isGETOmnichannelContactProps = ajv.compile<GETOmnichannelContactProps>(GETOmnichannelContactSchema);

type GETOmnichannelContactSearchProps = { email: string } | { phone: string };

type LivechatAnalyticsAgentsAverageServiceTimeProps = PaginatedRequest<{
	start: string;
	end: string;
}>;

const LivechatAnalyticsAgentsAverageServiceTimeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsAgentsAverageServiceTimeProps = ajv.compile<LivechatAnalyticsAgentsAverageServiceTimeProps>(
	LivechatAnalyticsAgentsAverageServiceTimeSchema,
);

const GETOmnichannelContactSearchSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				email: {
					type: 'string',
				},
			},
			required: ['email'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				phone: {
					type: 'string',
				},
			},
			required: ['phone'],
			additionalProperties: false,
		},
	],
};

export const isGETOmnichannelContactSearchProps = ajv.compile<GETOmnichannelContactSearchProps>(GETOmnichannelContactSearchSchema);

type POSTLivechatAgentStatusProps = { status?: ILivechatAgent['statusLivechat']; agentId?: string };

const POSTLivechatAgentStatusPropsSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
			enum: Object.values(ILivechatAgentStatus),
			nullable: true,
		},
		agentId: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isPOSTLivechatAgentStatusProps = ajv.compile<POSTLivechatAgentStatusProps>(POSTLivechatAgentStatusPropsSchema);

type LivechatAnalyticsAgentsTotalServiceTimeProps = PaginatedRequest<{
	start: string;
	end: string;
}>;

const LivechatAnalyticsAgentsTotalServiceTimeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsAgentsTotalServiceTimeProps = ajv.compile<LivechatAnalyticsAgentsTotalServiceTimeProps>(
	LivechatAnalyticsAgentsTotalServiceTimeSchema,
);

type LivechatAnalyticsAgentsAvailableForServiceHistoryProps = PaginatedRequest<{
	start: string;
	end: string;
	fullReport?: string;
}>;

const LivechatAnalyticsAgentsAvailableForServiceHistorySchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		fullReport: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsAgentsAvailableForServiceHistoryProps = ajv.compile<LivechatAnalyticsAgentsAvailableForServiceHistoryProps>(
	LivechatAnalyticsAgentsAvailableForServiceHistorySchema,
);

type LivechatAnalyticsDepartmentsAmountOfChatsProps = PaginatedRequest<{
	start: string;
	end: string;
	answered?: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsAmountOfChatsSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		answered: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsAmountOfChatsProps = ajv.compile<LivechatAnalyticsDepartmentsAmountOfChatsProps>(
	LivechatAnalyticsDepartmentsAmountOfChatsSchema,
);

type LivechatAnalyticsDepartmentsAverageServiceTimeProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsAverageServiceTimeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsAverageServiceTimeProps = ajv.compile<LivechatAnalyticsDepartmentsAverageServiceTimeProps>(
	LivechatAnalyticsDepartmentsAverageServiceTimeSchema,
);

type LivechatAnalyticsDepartmentsAverageChatDurationTimeProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsAverageChatDurationTimeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsAverageChatDurationTimeProps =
	ajv.compile<LivechatAnalyticsDepartmentsAverageChatDurationTimeProps>(LivechatAnalyticsDepartmentsAverageChatDurationTimeSchema);

type LivechatAnalyticsDepartmentsTotalServiceTimeProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsTotalServiceTimeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsTotalServiceTimeProps = ajv.compile<LivechatAnalyticsDepartmentsTotalServiceTimeProps>(
	LivechatAnalyticsDepartmentsTotalServiceTimeSchema,
);

type LivechatAnalyticsDepartmentsAverageWaitingTimeProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsAverageWaitingTimeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsAverageWaitingTimeProps = ajv.compile<LivechatAnalyticsDepartmentsAverageWaitingTimeProps>(
	LivechatAnalyticsDepartmentsAverageWaitingTimeSchema,
);

type LivechatAnalyticsDepartmentsTotalTransferredChatsProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsTotalTransferredChatsSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsTotalTransferredChatsProps = ajv.compile<LivechatAnalyticsDepartmentsTotalTransferredChatsProps>(
	LivechatAnalyticsDepartmentsTotalTransferredChatsSchema,
);

type LivechatAnalyticsDepartmentsTotalAbandonedChatsProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsTotalAbandonedChatsSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsTotalAbandonedChatsProps = ajv.compile<LivechatAnalyticsDepartmentsTotalAbandonedChatsProps>(
	LivechatAnalyticsDepartmentsTotalAbandonedChatsSchema,
);

type LivechatAnalyticsDepartmentsPercentageAbandonedChatsProps = PaginatedRequest<{
	start: string;
	end: string;
	departmentId?: string;
}>;

const LivechatAnalyticsDepartmentsPercentageAbandonedChatsSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isLivechatAnalyticsDepartmentsPercentageAbandonedChatsProps =
	ajv.compile<LivechatAnalyticsDepartmentsPercentageAbandonedChatsProps>(LivechatAnalyticsDepartmentsPercentageAbandonedChatsSchema);

type GETAgentNextToken = {
	department?: string;
};

const GETAgentNextTokenSchema = {
	type: 'object',
	properties: {
		department: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETAgentNextToken = ajv.compile<GETAgentNextToken>(GETAgentNextTokenSchema);

type GETLivechatConfigParams = {
	token?: string;
	department?: string;
	businessUnit?: string;
};

const GETLivechatConfigParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
			nullable: true,
		},
		department: {
			type: 'string',
			nullable: true,
		},
		businessUnit: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatConfigParams = ajv.compile<GETLivechatConfigParams>(GETLivechatConfigParamsSchema);

type POSTLivechatCustomFieldParams = {
	token: string;
	key: string;
	value: string;
	overwrite: boolean;
};

const POSTLivechatCustomFieldParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		key: {
			type: 'string',
		},
		value: {
			type: 'string',
		},
		overwrite: {
			type: 'boolean',
		},
	},
	required: ['token', 'key', 'value', 'overwrite'],
	additionalProperties: false,
};

export const isPOSTLivechatCustomFieldParams = ajv.compile<POSTLivechatCustomFieldParams>(POSTLivechatCustomFieldParamsSchema);

type POSTLivechatCustomFieldsParams = {
	token: string;
	customFields: {
		key: string;
		value: string;
		overwrite: boolean;
	}[];
};

const POSTLivechatCustomFieldsParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		customFields: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					key: {
						type: 'string',
					},
					value: {
						type: 'string',
					},
					overwrite: {
						type: 'boolean',
					},
				},
				required: ['key', 'value', 'overwrite'],
				additionalProperties: false,
			},
		},
	},
	required: ['token', 'customFields'],
	additionalProperties: false,
};

export const isPOSTLivechatCustomFieldsParams = ajv.compile<POSTLivechatCustomFieldsParams>(POSTLivechatCustomFieldsParamsSchema);

type GETWebRTCCall = { rid: string };

const GETWebRTCCallSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isGETWebRTCCall = ajv.compile<GETWebRTCCall>(GETWebRTCCallSchema);

type PUTWebRTCCallId = { rid: string; status: string };

const PUTWebRTCCallIdSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		status: {
			type: 'string',
		},
	},
	required: ['rid', 'status'],
	additionalProperties: false,
};

export const isPUTWebRTCCallId = ajv.compile<PUTWebRTCCallId>(PUTWebRTCCallIdSchema);

type POSTLivechatTranscriptParams = {
	rid: string;
	token: string;
	email: string;
};

const POSTLivechatTranscriptParamsSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		token: {
			type: 'string',
		},
		email: {
			type: 'string',
		},
	},
	required: ['rid', 'token', 'email'],
	additionalProperties: false,
};

export const isPOSTLivechatTranscriptParams = ajv.compile<POSTLivechatTranscriptParams>(POSTLivechatTranscriptParamsSchema);

type POSTLivechatOfflineMessageParams = {
	name: string;
	email: string;
	message: string;
	department?: string;
	host?: string;
};

const POSTLivechatOfflineMessageParamsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		email: {
			type: 'string',
		},
		message: {
			type: 'string',
		},
		department: {
			type: 'string',
			nullable: true,
		},
		host: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['name', 'email', 'message'],
	additionalProperties: false,
};

export const isPOSTLivechatOfflineMessageParams = ajv.compile<POSTLivechatOfflineMessageParams>(POSTLivechatOfflineMessageParamsSchema);

type POSTLivechatPageVisitedParams = {
	token: string;
	rid?: string;
	pageInfo: {
		title: string;
		change: string;
		location: {
			href: string;
		};
	};
};

const POSTLivechatPageVisitedParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
			nullable: true,
		},
		pageInfo: {
			type: 'object',
			properties: {
				title: {
					type: 'string',
				},
				change: {
					type: 'string',
				},
				location: {
					type: 'object',
					properties: {
						href: {
							type: 'string',
						},
					},
					required: ['href'],
					additionalProperties: false,
				},
			},
			required: ['title', 'change', 'location'],
			additionalProperties: false,
		},
	},
	required: ['token', 'pageInfo'],
	additionalProperties: false,
};

export const isPOSTLivechatPageVisitedParams = ajv.compile<POSTLivechatPageVisitedParams>(POSTLivechatPageVisitedParamsSchema);

type POSTLivechatMessageParams = {
	token: string;
	rid: string;
	msg: string;
	_id?: string;
	agent?: {
		agentId: string;
		username: string;
	};
};

const POSTLivechatMessageParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		msg: {
			type: 'string',
		},
		_id: {
			type: 'string',
			nullable: true,
		},
		agent: {
			type: 'object',
			properties: {
				agentId: {
					type: 'string',
				},
				username: {
					type: 'string',
				},
			},
			required: ['agentId', 'username'],
			additionalProperties: false,
		},
	},
	required: ['token', 'rid', 'msg'],
	additionalProperties: false,
};

export const isPOSTLivechatMessageParams = ajv.compile<POSTLivechatMessageParams>(POSTLivechatMessageParamsSchema);

type GETLivechatMessageIdParams = {
	token: string;
	rid: string;
};

const GETLivechatMessageIdParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
	},
	required: ['token', 'rid'],
	additionalProperties: false,
};

export const isGETLivechatMessageIdParams = ajv.compile<GETLivechatMessageIdParams>(GETLivechatMessageIdParamsSchema);

type PUTLivechatMessageIdParams = {
	token: string;
	rid: string;
	msg: string;
};

const PUTLivechatMessageIdParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		msg: {
			type: 'string',
		},
	},
	required: ['token', 'rid', 'msg'],
	additionalProperties: false,
};

export const isPUTLivechatMessageIdParams = ajv.compile<PUTLivechatMessageIdParams>(PUTLivechatMessageIdParamsSchema);

type DELETELivechatMessageIdParams = {
	token: string;
	rid: string;
};

const DELETELivechatMessageIdParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
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
	},
	required: ['token', 'rid'],
	additionalProperties: false,
};

export const isDELETELivechatMessageIdParams = ajv.compile<DELETELivechatMessageIdParams>(DELETELivechatMessageIdParamsSchema);

type GETLivechatMessagesHistoryRidParams = PaginatedRequest<{
	searchText?: string;
	token: string;
	ls?: string;
	end?: string;
	limit?: number;
}>;

const GETLivechatMessagesHistoryRidParamsSchema = {
	type: 'object',
	properties: {
		searchText: {
			type: 'string',
			nullable: true,
		},
		token: {
			type: 'string',
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
		ls: {
			type: 'string',
			nullable: true,
		},
		end: {
			type: 'string',
			nullable: true,
		},
		limit: {
			type: 'number',
			nullable: true,
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isGETLivechatMessagesHistoryRidParams = ajv.compile<GETLivechatMessagesHistoryRidParams>(
	GETLivechatMessagesHistoryRidParamsSchema,
);

type GETLivechatMessagesParams = {
	visitor: {
		token: string;
	};
	// Must be of at least 1 item
	messages: {
		msg: string;
	}[];
};

const GETLivechatMessagesParamsSchema = {
	type: 'object',
	properties: {
		visitor: {
			type: 'object',
			properties: {
				token: {
					type: 'string',
				},
			},
			required: ['token'],
			additionalProperties: false,
		},
		messages: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					msg: {
						type: 'string',
					},
				},
				required: ['msg'],
				additionalProperties: false,
			},
			minItems: 1,
		},
	},
	required: ['visitor', 'messages'],
	additionalProperties: false,
};

export const isGETLivechatMessagesParams = ajv.compile<GETLivechatMessagesParams>(GETLivechatMessagesParamsSchema);

type GETLivechatRoomParams = {
	token: string;
	rid?: string;
	agentId?: string;
};

const GETLivechatRoomParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
			nullable: true,
		},
		agentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['token'],
	additionalProperties: true,
};

export const isGETLivechatRoomParams = ajv.compile<GETLivechatRoomParams>(GETLivechatRoomParamsSchema);

type POSTLivechatRoomCloseParams = {
	token: string;
	rid: string;
};

const POSTLivechatRoomCloseParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
	},
	required: ['token', 'rid'],
	additionalProperties: false,
};

export const isPOSTLivechatRoomCloseParams = ajv.compile<POSTLivechatRoomCloseParams>(POSTLivechatRoomCloseParamsSchema);

type POSTLivechatRoomCloseByUserParams = {
	rid: string;
	comment?: string;
	tags?: string[];
	generateTranscriptPdf?: boolean;
	forceClose?: boolean;
	transcriptEmail?:
		| {
				// Note: if sendToVisitor is false, then any previously requested transcripts (like via livechat:requestTranscript) will be also cancelled
				sendToVisitor: false;
		  }
		| {
				sendToVisitor: true;
				requestData: Pick<NonNullable<IOmnichannelRoom['transcriptRequest']>, 'email' | 'subject'>;
		  };
};

const POSTLivechatRoomCloseByUserParamsSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		comment: {
			type: 'string',
			nullable: true,
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		generateTranscriptPdf: {
			type: 'boolean',
			nullable: true,
		},
		transcriptEmail: {
			type: 'object',
			properties: {
				sendToVisitor: {
					type: 'boolean',
				},
				requestData: {
					type: 'object',
					properties: {
						email: {
							type: 'string',
						},
						subject: {
							type: 'string',
						},
					},
					required: ['email', 'subject'],
					additionalProperties: false,
				},
			},
			required: ['sendToVisitor'],
			additionalProperties: false,
		},
		forceClose: {
			type: 'boolean',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isPOSTLivechatRoomCloseByUserParams = ajv.compile<POSTLivechatRoomCloseByUserParams>(POSTLivechatRoomCloseByUserParamsSchema);

type POSTLivechatRoomTransferParams = {
	token: string;
	rid: string;
	department: string;
};

const POSTLivechatRoomTransferParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		department: {
			type: 'string',
		},
	},
	required: ['token', 'rid', 'department'],
	additionalProperties: false,
};

export const isPOSTLivechatRoomTransferParams = ajv.compile<POSTLivechatRoomTransferParams>(POSTLivechatRoomTransferParamsSchema);

type POSTLivechatRoomSurveyParams = {
	token: string;
	rid: string;
	data: {
		name: string;
		value: string;
	}[];
};

const POSTLivechatRoomSurveyParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		data: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
					},
					value: {
						type: 'string',
					},
				},
				required: ['name', 'value'],
				additionalProperties: false,
			},
			minItems: 1,
		},
	},
	required: ['token', 'rid', 'data'],
	additionalProperties: false,
};

export const isPOSTLivechatRoomSurveyParams = ajv.compile<POSTLivechatRoomSurveyParams>(POSTLivechatRoomSurveyParamsSchema);

type POSTCannedResponsesProps = {
	_id?: string;
	shortcut: string;
	text: string;
	scope: string;
	departmentId?: string;
	tags?: string[];
};

const POSTCannedResponsesPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			nullable: true,
		},
		shortcut: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
		scope: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
	},
	required: ['shortcut', 'text', 'scope'],
	additionalProperties: false,
};

export const isPOSTCannedResponsesProps = ajv.compile<POSTCannedResponsesProps>(POSTCannedResponsesPropsSchema);

type DELETECannedResponsesProps = {
	_id: string;
};

const DELETECannedResponsesPropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
	},
	required: ['_id'],
	additionalProperties: false,
};

export const isDELETECannedResponsesProps = ajv.compile<DELETECannedResponsesProps>(DELETECannedResponsesPropsSchema);

type POSTLivechatUsersTypeProps = {
	username: string;
};

const POSTLivechatUsersTypePropsSchema = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isPOSTLivechatUsersTypeProps = ajv.compile<POSTLivechatUsersTypeProps>(POSTLivechatUsersTypePropsSchema);

type GETLivechatVisitorsPagesVisitedRoomIdParams = PaginatedRequest;

const GETLivechatVisitorsPagesVisitedRoomIdParamsSchema = {
	type: 'object',
	properties: {
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
	},
	additionalProperties: false,
};

export const isGETLivechatVisitorsPagesVisitedRoomIdParams = ajv.compile<GETLivechatVisitorsPagesVisitedRoomIdParams>(
	GETLivechatVisitorsPagesVisitedRoomIdParamsSchema,
);

type GETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParams = PaginatedRequest;

const GETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParamsSchema = {
	type: 'object',
	properties: {
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
	},
	additionalProperties: false,
};

export const isGETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParams =
	ajv.compile<GETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParams>(
		GETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParamsSchema,
	);

type GETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParams = PaginatedRequest<{
	searchText?: string;
	closedChatsOnly?: string;
	servedChatsOnly?: string;
	source?: string;
}>;

const GETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParamsSchema = {
	type: 'object',
	properties: {
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
		searchText: {
			type: 'string',
			nullable: true,
		},
		closedChatsOnly: {
			type: 'string',
			nullable: true,
		},
		servedChatsOnly: {
			type: 'string',
			nullable: true,
		},
		source: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParams =
	ajv.compile<GETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParams>(
		GETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParamsSchema,
	);

type GETLivechatVisitorsAutocompleteParams = { selector: string };

const GETLivechatVisitorsAutocompleteParamsSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isGETLivechatVisitorsAutocompleteParams = ajv.compile<GETLivechatVisitorsAutocompleteParams>(
	GETLivechatVisitorsAutocompleteParamsSchema,
);

type GETLivechatVisitorsSearch = PaginatedRequest<{ term?: string }>;

const GETLivechatVisitorsSearchSchema = {
	type: 'object',
	properties: {
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
		term: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['term'],
	additionalProperties: false,
};

export const isGETLivechatVisitorsSearch = ajv.compile<GETLivechatVisitorsSearch>(GETLivechatVisitorsSearchSchema);

type GETLivechatAgentsAgentIdDepartmentsParams = { enabledDepartmentsOnly?: booleanString };

const GETLivechatAgentsAgentIdDepartmentsParamsSchema = {
	type: 'object',
	properties: {
		enabledDepartmentsOnly: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatAgentsAgentIdDepartmentsParams = ajv.compile<GETLivechatAgentsAgentIdDepartmentsParams>(
	GETLivechatAgentsAgentIdDepartmentsParamsSchema,
);

type GETBusinessHourParams = { _id?: string; type?: string };

const GETBusinessHourParamsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETBusinessHourParams = ajv.compile<GETBusinessHourParams>(GETBusinessHourParamsSchema);

type GETLivechatTriggersParams = PaginatedRequest;

const GETLivechatTriggersParamsSchema = {
	type: 'object',
	properties: {
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
	},
	additionalProperties: false,
};

export const isGETLivechatTriggersParams = ajv.compile<GETLivechatTriggersParams>(GETLivechatTriggersParamsSchema);

export type GETLivechatRoomsParams = PaginatedRequest<{
	fields?: string;
	createdAt?: string;
	customFields?: string;
	closedAt?: string;
	agents?: string[];
	roomName?: string;
	// TODO: support only arrays on next major
	departmentId?: string | string[];
	open?: string | boolean;
	onhold?: string | boolean;
	queued?: string | boolean;
	tags?: string[];
	units?: string[];
}>;

const GETLivechatRoomsParamsSchema = {
	type: 'object',
	properties: {
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
		fields: {
			type: 'string',
			nullable: true,
		},
		createdAt: {
			type: 'string',
			nullable: true,
		},
		customFields: {
			type: 'string',
			nullable: true,
		},
		closedAt: {
			type: 'string',
			nullable: true,
		},
		agents: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		roomName: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
		},
		open: {
			anyOf: [
				{ type: 'string', nullable: true },
				{ type: 'boolean', nullable: true },
			],
		},
		onhold: {
			anyOf: [
				{ type: 'string', nullable: true },
				{ type: 'boolean', nullable: true },
			],
		},
		queued: {
			anyOf: [
				{ type: 'string', nullable: true },
				{ type: 'boolean', nullable: true },
			],
		},
		tags: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		units: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	additionalProperties: false,
};

export const isGETLivechatRoomsParams = ajv.compile<GETLivechatRoomsParams>(GETLivechatRoomsParamsSchema);

export type POSTLivechatRoomPriorityParams = {
	priorityId: string;
};

const POSTLivechatRoomPriorityParamsSchema = {
	type: 'object',
	properties: {
		priorityId: {
			type: 'string',
		},
	},
	required: ['priorityId'],
	additionalProperties: false,
};

export const isPOSTLivechatRoomPriorityParams = ajv.compile<POSTLivechatRoomPriorityParams>(POSTLivechatRoomPriorityParamsSchema);

type GETLivechatQueueParams = PaginatedRequest<{ agentId?: string; departmentId?: string; includeOfflineAgents?: string }>;

const GETLivechatQueueParamsSchema = {
	type: 'object',
	properties: {
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
		agentId: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
		includeOfflineAgents: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatQueueParams = ajv.compile<GETLivechatQueueParams>(GETLivechatQueueParamsSchema);

type GETLivechatPrioritiesParams = PaginatedRequest<{ text?: string }>;

const GETLivechatPrioritiesParamsSchema = {
	type: 'object',
	properties: {
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
		text: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isGETLivechatPrioritiesParams = ajv.compile<GETLivechatPrioritiesParams>(GETLivechatPrioritiesParamsSchema);

type DELETELivechatPriorityParams = {
	priorityId: string;
};

const DELETELivechatPriorityParamsSchema = {
	type: 'object',
	properties: {
		priorityId: {
			type: 'string',
		},
	},
	required: ['priorityId'],
	additionalProperties: false,
};

export const isDELETELivechatPriorityParams = ajv.compile<DELETELivechatPriorityParams>(DELETELivechatPriorityParamsSchema);

type POSTLivechatPriorityParams = { name: string; level: string };

const POSTLivechatPriorityParamsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
			nullable: false,
		},
		level: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['name', 'level'],
	additionalProperties: false,
};

export const isPOSTLivechatPriorityParams = ajv.compile<POSTLivechatPriorityParams>(POSTLivechatPriorityParamsSchema);

type GETLivechatInquiriesListParams = PaginatedRequest<{ department?: string }>;

const GETLivechatInquiriesListParamsSchema = {
	type: 'object',
	properties: {
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
		department: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatInquiriesListParams = ajv.compile<GETLivechatInquiriesListParams>(GETLivechatInquiriesListParamsSchema);

type POSTLivechatInquiriesTakeParams = {
	inquiryId: string;
	userId?: string;
};

const POSTLivechatInquiriesTakeParamsSchema = {
	type: 'object',
	properties: {
		inquiryId: {
			type: 'string',
		},
		userId: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['inquiryId'],
};

export const isPOSTLivechatInquiriesTakeParams = ajv.compile<POSTLivechatInquiriesTakeParams>(POSTLivechatInquiriesTakeParamsSchema);

type GETLivechatInquiriesQueuedForUserParams = PaginatedRequest<{ department?: string }>;

const GETLivechatInquiriesQueuedForUserParamsSchema = {
	type: 'object',
	properties: {
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
		department: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isGETLivechatInquiriesQueuedForUserParams = ajv.compile<GETLivechatInquiriesQueuedForUserParams>(
	GETLivechatInquiriesQueuedForUserParamsSchema,
);

type GETLivechatInquiriesGetOneParams = {
	roomId: string;
};

const GETLivechatInquiriesGetOneParamsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['roomId'],
};

export const isGETLivechatInquiriesGetOneParams = ajv.compile<GETLivechatInquiriesGetOneParams>(GETLivechatInquiriesGetOneParamsSchema);

type GETDashboardTotalizers = {
	start: string;
	end: string;
	departmentId?: string;
};

const GETLivechatAnalyticsDashboardsConversationTotalizersParamsSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['start', 'end'],
};

export const isGETDashboardTotalizerParams = ajv.compile<GETDashboardTotalizers>(
	GETLivechatAnalyticsDashboardsConversationTotalizersParamsSchema,
);

type GETDashboardsAgentStatusParams = {
	departmentId?: string;
};

const GETLivechatAnalyticsDashboardsAgentStatusParamsSchema = {
	type: 'object',
	properties: {
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	// FE is sending start/end params, since they use the same container for doing all calls.
	// This will prevent FE breaking, but's a TODO for an upcoming engday
	additionalProperties: true,
};

export const isGETDashboardsAgentStatusParams = ajv.compile<GETDashboardsAgentStatusParams>(
	GETLivechatAnalyticsDashboardsAgentStatusParamsSchema,
);

type PUTLivechatPriority = { name: string } | { reset: boolean };
const PUTLivechatPrioritySchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				name: {
					type: 'string',
				},
				required: true,
			},
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				reset: {
					type: 'boolean',
				},
				required: true,
			},
			additionalProperties: false,
		},
	],
};

export const isPUTLivechatPriority = ajv.compile<PUTLivechatPriority>(PUTLivechatPrioritySchema);

type POSTomnichannelIntegrations = {
	LivechatWebhookUrl: string;
	LivechatSecretToken: string;
	LivechatHttpTimeout: number;
	LivechatWebhookOnStart: boolean;
	LivechatWebhookOnClose: boolean;
	LivechatWebhookOnChatTaken: boolean;
	LivechatWebhookOnChatQueued: boolean;
	LivechatWebhookOnForward: boolean;
	LivechatWebhookOnOfflineMsg: boolean;
	LivechatWebhookOnVisitorMessage: boolean;
	LivechatWebhookOnAgentMessage: boolean;
};

const POSTomnichannelIntegrationsSchema = {
	type: 'object',
	properties: {
		LivechatWebhookUrl: {
			type: 'string',
			nullable: true,
		},
		LivechatSecretToken: {
			type: 'string',
			nullable: true,
		},
		LivechatHttpTimeout: {
			type: 'number',
			nullable: true,
		},
		LivechatWebhookOnStart: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnClose: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnChatTaken: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnChatQueued: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnForward: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnOfflineMsg: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnVisitorMessage: {
			type: 'boolean',
			nullable: true,
		},
		LivechatWebhookOnAgentMessage: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isPOSTomnichannelIntegrations = ajv.compile<POSTomnichannelIntegrations>(POSTomnichannelIntegrationsSchema);

type POSTLivechatTranscriptRequestParams = {
	email: string;
	subject: string;
};

const POSTLivechatTranscriptRequestParamsSchema = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
		},
		subject: {
			type: 'string',
		},
	},
	required: ['email', 'subject'],
	additionalProperties: false,
};

export const isPOSTLivechatTranscriptRequestParams = ajv.compile<POSTLivechatTranscriptRequestParams>(
	POSTLivechatTranscriptRequestParamsSchema,
);

type POSTLivechatTriggersParams = {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	conditions: ILivechatTriggerCondition[];
	actions: ILivechatTriggerAction[];
	_id?: string;
};

const POSTLivechatTriggersParamsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		enabled: {
			type: 'boolean',
		},
		runOnce: {
			type: 'boolean',
		},
		conditions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						enum: ['time-on-site', 'page-url', 'chat-opened-by-visitor', 'after-guest-registration'],
					},
					value: {
						type: 'string',
						nullable: true,
					},
				},
				required: ['name', 'value'],
				additionalProperties: false,
			},
			minItems: 1,
		},
		actions: {
			type: 'array',
			items: {
				oneOf: [
					{
						type: 'object',
						properties: {
							name: {
								type: 'string',
								enum: ['send-message'],
							},
							params: {
								type: 'object',
								nullable: true,
								properties: {
									sender: {
										type: 'string',
										enum: ['queue', 'custom'],
									},
									msg: {
										type: 'string',
									},
									name: {
										type: 'string',
										nullable: true,
									},
								},
								required: ['sender', 'msg'],
								additionalProperties: false,
							},
						},
						required: ['name'],
						additionalProperties: false,
					},
					{
						type: 'object',
						properties: {
							name: {
								type: 'string',
								enum: ['use-external-service'],
							},
							params: {
								type: 'object',
								nullable: true,
								properties: {
									sender: {
										type: 'string',
										enum: ['queue', 'custom'],
									},
									name: {
										type: 'string',
										nullable: true,
									},
									serviceUrl: {
										type: 'string',
									},
									serviceTimeout: {
										type: 'number',
									},
									serviceFallbackMessage: {
										type: 'string',
									},
								},
								required: ['serviceUrl', 'serviceTimeout', 'serviceFallbackMessage'],
								additionalProperties: false,
							},
						},
						required: ['name'],
						additionalProperties: false,
					},
				],
			},
			minItems: 1,
		},
		_id: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['name', 'description', 'enabled', 'runOnce', 'conditions', 'actions'],
	additionalProperties: false,
};

export const isPOSTLivechatTriggersParams = ajv.compile<POSTLivechatTriggersParams>(POSTLivechatTriggersParamsSchema);

type POSTLivechatAppearanceParams = {
	_id: string;
	value: string | boolean | number | string[];
}[];

const POSTLivechatAppearanceParamsSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			_id: {
				type: 'string',
			},
			value: {
				// Be careful with anyOf - https://github.com/ajv-validator/ajv/issues/1140
				type: ['string', 'boolean', 'number', 'array'],
			},
		},
		required: ['_id', 'value'],
		additionalProperties: false,
	},
	minItems: 1,
};

export const isPOSTLivechatAppearanceParams = ajv.compile<POSTLivechatAppearanceParams>(POSTLivechatAppearanceParamsSchema);

type GETDashboardConversationsByType = {
	start: string;
	end: string;
	sort?: string;
};

const GETDashboardConversationsByTypeSchema = {
	type: 'object',
	properties: {
		start: {
			type: 'string',
		},
		end: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
	},
	required: ['start', 'end'],
	additionalProperties: false,
};

export const isGETDashboardConversationsByType = ajv.compile<GETDashboardConversationsByType>(GETDashboardConversationsByTypeSchema);

type LivechatAnalyticsAgentOverviewProps = {
	name: string;
	from: string;
	to: string;
	departmentId?: string;
};

const LivechatAnalyticsAgentOverviewPropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		from: {
			type: 'string',
		},
		to: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['name', 'from', 'to'],
	additionalProperties: false,
};

export const isLivechatAnalyticsAgentOverviewProps = ajv.compile<LivechatAnalyticsAgentOverviewProps>(
	LivechatAnalyticsAgentOverviewPropsSchema,
);

type LivechatAnalyticsOverviewProps = {
	name: string;
	from: string;
	to: string;
	departmentId?: string;
};

const LivechatAnalyticsOverviewPropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		from: {
			type: 'string',
		},
		to: {
			type: 'string',
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['name', 'from', 'to'],
	additionalProperties: false,
};

export const isLivechatAnalyticsOverviewProps = ajv.compile<LivechatAnalyticsOverviewProps>(LivechatAnalyticsOverviewPropsSchema);

type LivechatTriggerWebhookTestParams = {
	webhookUrl: string;
	timeout: number;
	fallbackMessage: string;
	extraData: {
		key: string;
		value: string;
	}[];
};

const LivechatTriggerWebhookTestParamsSchema = {
	type: 'object',
	properties: {
		webhookUrl: {
			type: 'string',
		},
		timeout: {
			type: 'number',
		},
		fallbackMessage: {
			type: 'string',
		},
		extraData: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					key: {
						type: 'string',
					},
					value: {
						type: 'string',
					},
				},
				required: ['key', 'value'],
				additionalProperties: false,
			},
			nullable: true,
		},
	},
	required: ['webhookUrl', 'timeout', 'fallbackMessage'],
	additionalProperties: false,
};

export const isLivechatTriggerWebhookTestParams = ajv.compile<LivechatTriggerWebhookTestParams>(LivechatTriggerWebhookTestParamsSchema);

type LivechatTriggerWebhookCallParams = {
	token: string;
	extraData?: {
		key: string;
		value: string;
	}[];
};

const LivechatTriggerWebhookCallParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
		extraData: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					key: {
						type: 'string',
					},
					value: {
						type: 'string',
					},
				},
				required: ['key', 'value'],
				additionalProperties: false,
			},
			nullable: true,
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatTriggerWebhookCallParams = ajv.compile<LivechatTriggerWebhookCallParams>(LivechatTriggerWebhookCallParamsSchema);

export type ILivechatContactWithManagerData = Omit<ILivechatContact, 'contactManager'> & {
	contactManager?: Pick<IUser, '_id' | 'name' | 'username'>;
};

export type OmnichannelEndpoints = {
	'/v1/livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
		};
		POST: (params: POSTLivechatAppearanceParams) => void;
	};
	'/v1/livechat/visitors.info': {
		GET: (params: LivechatVisitorsInfo) => {
			visitor: ILivechatVisitor;
		};
	};
	'/v1/livechat/room.onHold': {
		POST: (params: LivechatRoomOnHold) => void;
	};
	'/v1/livechat/room.resumeOnHold': {
		POST: (params: LivechatRoomResumeOnHold) => void;
	};
	'/v1/livechat/room.join': {
		GET: (params: LiveChatRoomJoin) => void;
	};
	'/v1/livechat/room.forward': {
		POST: (params: LiveChatRoomForward) => void;
	};
	'/v1/livechat/room.saveInfo': {
		POST: (params: LiveChatRoomSaveInfo) => void;
	};
	'/v1/livechat/monitors': {
		GET: (params: LivechatMonitorsListProps) => PaginatedResult<{
			monitors: ILivechatMonitor[];
		}>;
	};
	'/v1/livechat/monitors/:username': {
		GET: () => ILivechatMonitor;
	};
	'/v1/livechat/tags': {
		GET: (params: LivechatTagsListProps) => PaginatedResult<{
			tags: ILivechatTag[];
		}>;
	};
	'/v1/livechat/tags/:tagId': {
		GET: () => ILivechatTag;
	};
	'/v1/livechat/department': {
		GET: (params?: LivechatDepartmentProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
		POST: (params: {
			department: LivechatDepartmentDTO;
			agents: Pick<ILivechatDepartmentAgents, 'agentId' | 'count' | 'order'>[];
			departmentUnit?: { _id?: string };
		}) => {
			department: ILivechatDepartment;
			agents: ILivechatDepartmentAgents[];
		};
	};
	'/v1/livechat/department/:_id': {
		GET: (params: LivechatDepartmentId) => {
			department: ILivechatDepartment;
			agents?: ILivechatDepartmentAgents[];
		};
		PUT: (params: {
			department: LivechatDepartmentDTO;
			agents: Pick<ILivechatDepartmentAgents, 'agentId' | 'count' | 'order' | 'username'>[];
			departmentUnit?: { _id?: string };
		}) => {
			department: ILivechatDepartment | null;
			agents: ILivechatDepartmentAgents[];
		};
		DELETE: () => void;
	};
	'/v1/livechat/departments/archived': {
		GET: (params?: LivechatDepartmentProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'/v1/livechat/department/:_id/archive': {
		POST: () => void;
	};
	'/v1/livechat/department/:_id/unarchive': {
		POST: () => void;
	};

	'/v1/livechat/department.autocomplete': {
		GET: (params: LivechatDepartmentAutocomplete) => {
			items: ILivechatDepartment[];
		};
	};
	'/v1/livechat/department/:_id/agents': {
		GET: (params: LivechatDepartmentDepartmentIdAgentsGET) => PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>;
		POST: (params: LivechatDepartmentDepartmentIdAgentsPOST) => void;
	};
	'/v1/livechat/units/:unitId/departments/available': {
		GET: (params: LivechatDepartmentsAvailableByUnitIdProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'/v1/livechat/departments.by-unit/': {
		GET: (params: LivechatDepartmentsByUnitProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'/v1/livechat/units/:unitId/departments': {
		GET: (params: LivechatDepartmentsByUnitIdProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'/v1/livechat/department.listByIds': {
		GET: (params: { ids: string[]; fields?: Record<string, unknown> }) => {
			departments: ILivechatDepartment[];
		};
	};

	'/v1/livechat/department/isDepartmentCreationAvailable': {
		GET: () => { isDepartmentCreationAvailable: boolean };
	};

	'/v1/livechat/custom-fields': {
		GET: (params?: LivechatCustomFieldsProps) => PaginatedResult<{
			customFields: ILivechatCustomField[];
		}>;
	};
	'/v1/livechat/custom-fields/:_id': {
		GET: () => { customField: ILivechatCustomField };
	};
	'/v1/livechat/:rid/messages': {
		GET: (params: LivechatRidMessagesProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};

	'/v1/livechat/users/:type': {
		GET: (params: LivechatUsersManagerGETProps) => PaginatedResult<{
			users: (ILivechatAgent & { departments: string[] })[];
		}>;
		POST: (params: POSTLivechatUsersTypeProps) => { success: boolean };
	};

	'/v1/livechat/users/:type/:_id': {
		GET: () => { user: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'> | null };
		DELETE: () => void;
	};

	// For some reason, when using useEndpointData with POST, it's not able to detect the actual type of a path with path params
	// So, we need to define the type of the path params here
	'/v1/livechat/users/manager': {
		GET: (params: LivechatUsersManagerGETProps) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: POSTLivechatUsersTypeProps) => { success: boolean };
	};

	'/v1/livechat/users/user': {
		GET: (params: LivechatUsersManagerGETProps) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: POSTLivechatUsersTypeProps) => { success: boolean };
	};
	'/v1/livechat/users/manager/:_id': {
		GET: () => { user: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'> | null };
		DELETE: () => void;
	};
	'/v1/livechat/users/user/:_id': {
		GET: () => { user: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'> | null };
		DELETE: () => void;
	};

	'/v1/livechat/users/agent': {
		GET: (
			params: PaginatedRequest<{ text?: string; onlyAvailable?: boolean; excludeId?: string; showIdleAgents?: boolean }>,
		) => PaginatedResult<{
			users: (ILivechatAgent & { departments: string[] })[];
		}>;
		POST: (params: LivechatUsersManagerPOSTProps) => { success: boolean };
	};

	'/v1/livechat/users/agent/:_id': {
		GET: (
			params?: PaginatedRequest<{
				text: string;
			}>,
		) => { user: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'> };
		DELETE: () => { success: boolean };
	};

	'/v1/livechat/visitor': {
		POST: (params: { visitor: ILivechatVisitorDTO }) => {
			visitor: ILivechatVisitor;
		};
	};

	'/v1/livechat/visitor/:token': {
		GET: (params?: LivechatVisitorTokenGet) => { visitor: ILivechatVisitor };
		DELETE: (params: LivechatVisitorTokenDelete) => {
			visitor: { _id: string; ts: string };
		};
	};

	'/v1/livechat/visitor/:token/room': {
		GET: (params: LivechatVisitorTokenRoom) => { rooms: IOmnichannelRoom[] };
	};

	'/v1/livechat/visitor.callStatus': {
		POST: (params: LivechatVisitorCallStatus) => {
			token: string;
			callStatus: string;
		};
	};

	'/v1/livechat/visitor.status': {
		POST: (params: LivechatVisitorStatus) => {
			token: string;
			status: string;
		};
	};

	'/v1/livechat/agents/:uid/departments': {
		GET: (params: { enableDepartmentsOnly: 'true' | 'false' | '0' | '1' }) => { departments: ILivechatDepartmentAgents[] };
	};

	'/v1/livechat/agent.status': {
		POST: (params: POSTLivechatAgentStatusProps) => { status: ILivechatAgent['statusLivechat'] };
	};

	'/v1/canned-responses': {
		GET: (params: CannedResponsesProps) => PaginatedResult<{
			cannedResponses: IOmnichannelCannedResponse[];
		}>;
		POST: (params: POSTCannedResponsesProps) => void;
		DELETE: (params: DELETECannedResponsesProps) => void;
	};

	'/v1/canned-responses/:_id': {
		GET: () => { cannedResponse: IOmnichannelCannedResponse };
	};

	'/v1/canned-responses.get': {
		GET: () => { responses: IOmnichannelCannedResponse[] };
	};

	'/v1/livechat/webrtc.call': {
		GET: (params: GETWebRTCCall) => { videoCall: { rid: string; provider: string; callStatus: 'ringing' | 'ongoing' } };
	};

	'/v1/livechat/webrtc.call/:callId': {
		PUT: (params: PUTWebRTCCallId) => { status: string | undefined };
	};

	'/v1/livechat/sla': {
		GET: (params: LivechatPrioritiesProps) => PaginatedResult<{ sla: IOmnichannelServiceLevelAgreements[] }>;
		POST: (params: CreateOrUpdateLivechatSlaProps) => { sla: Omit<IOmnichannelServiceLevelAgreements, '_updatedAt'> };
	};

	'/v1/livechat/sla/:slaId': {
		GET: () => IOmnichannelServiceLevelAgreements;
		PUT: (params: CreateOrUpdateLivechatSlaProps) => { sla: Omit<IOmnichannelServiceLevelAgreements, '_updatedAt'> };
		DELETE: () => void;
	};

	'/v1/livechat/priorities': {
		GET: (params: GETLivechatPrioritiesParams) => PaginatedResult<{ priorities: ILivechatPriority[] }>;
	};

	'/v1/livechat/priorities/:priorityId': {
		GET: () => ILivechatPriority | void;
		PUT: (params: PUTLivechatPriority) => void;
	};

	'/v1/livechat/priorities.reset': {
		POST: () => void;
		GET: () => { reset: boolean };
	};

	'/v1/livechat/visitors.search': {
		GET: (params: GETLivechatVisitorsSearch) => PaginatedResult<{ visitors: (ILivechatVisitor & { fname?: string })[] }>;
	};
	'/v1/omnichannel/contact': {
		POST: (params: POSTOmnichannelContactProps) => { contact: string };

		GET: (params: GETOmnichannelContactProps) => { contact: ILivechatVisitor | null };
	};

	'/v1/omnichannel/contacts': {
		POST: (params: POSTOmnichannelContactsProps) => { contactId: string };
	};
	'/v1/omnichannel/contacts.update': {
		POST: (params: POSTUpdateOmnichannelContactsProps) => { contact: ILivechatContact };
	};
	'/v1/omnichannel/contacts.get': {
		GET: (params: GETOmnichannelContactsProps) => { contact: ILivechatContact | null };
	};
	'/v1/omnichannel/contacts.search': {
		GET: (params: GETOmnichannelContactsSearchProps) => PaginatedResult<{ contacts: ILivechatContactWithManagerData[] }>;
	};
	'/v1/omnichannel/contacts.checkExistence': {
		GET: (params: GETOmnichannelContactsCheckExistenceProps) => { exists: boolean };
	};
	'/v1/omnichannel/contacts.history': {
		GET: (params: GETOmnichannelContactHistoryProps) => PaginatedResult<{ history: ContactSearchChatsResult[] }>;
	};
	'/v1/omnichannel/contacts.channels': {
		GET: (params: GETOmnichannelContactsChannelsProps) => { channels: ILivechatContactChannel[] | null };
	};
	'/v1/omnichannel/contact.search': {
		GET: (params: GETOmnichannelContactSearchProps) => { contact: ILivechatVisitor | null };
	};
	'/v1/livechat/agent.info/:rid/:token': {
		GET: () => { agent: ILivechatAgent | { hiddenInfo: true } };
	};
	'/v1/livechat/agent.next/:token': {
		GET: (params: GETAgentNextToken) => { agent: ILivechatAgent | { hiddenInfo: true } } | void;
	};
	'/v1/livechat/config': {
		GET: (params: GETLivechatConfigParams) => {
			config: { [k: string]: string | boolean } & { room?: IOmnichannelRoom; agent?: ILivechatAgent };
		};
	};
	'/v1/livechat/custom.field': {
		POST: (params: POSTLivechatCustomFieldParams) => { field: { key: string; value: string; overwrite: boolean } };
	};
	'/v1/livechat/custom.fields': {
		POST: (params: POSTLivechatCustomFieldsParams) => { fields: { Key: string; value: string; overwrite: boolean }[] };
	};
	'/v1/livechat/transfer.history/:rid': {
		GET: () => PaginatedResult<{ history: IOmnichannelSystemMessage['transferData'][] }>;
	};
	'/v1/livechat/transcript': {
		POST: (params: POSTLivechatTranscriptParams) => { message: string };
	};
	'/v1/livechat/transcript/:rid': {
		DELETE: () => void;
		POST: (params: POSTLivechatTranscriptRequestParams) => void;
	};
	'/v1/livechat/offline.message': {
		POST: (params: POSTLivechatOfflineMessageParams) => { message: string };
	};
	'/v1/livechat/page.visited': {
		POST: (params: POSTLivechatPageVisitedParams) => { page: Pick<IOmnichannelSystemMessage, 'msg' | 'navigation'> } | void;
	};
	'/v1/livechat/message': {
		POST: (params: POSTLivechatMessageParams) => { message: IMessage };
	};
	'/v1/livechat/message/:_id': {
		GET: (parms: GETLivechatMessageIdParams) => { message: IMessage | void };
		PUT: (params: PUTLivechatMessageIdParams) => { message: IMessage | void };
		DELETE: (params: DELETELivechatMessageIdParams) => { message: Pick<Serialized<IMessage>, 'ts' | '_id'> };
	};
	'/v1/livechat/messages.history/:rid': {
		GET: (params: GETLivechatMessagesHistoryRidParams) => { messages: IMessage[] };
	};
	'/v1/livechat/messages': {
		POST: (params: GETLivechatMessagesParams) => { messages: { username: string; msg: string; ts: Date }[] };
	};
	'/v1/livechat/room': {
		GET: (params: GETLivechatRoomParams) => { room: IOmnichannelRoom; newRoom: boolean } | IOmnichannelRoom;
	};
	'/v1/livechat/room.close': {
		POST: (params: POSTLivechatRoomCloseParams) => { rid: string; comment: string };
	};
	'/v1/livechat/room.closeByUser': {
		POST: (params: POSTLivechatRoomCloseByUserParams) => void;
	};
	'/v1/livechat/room.transfer': {
		POST: (params: POSTLivechatRoomTransferParams) => Deprecated<{ room: IOmnichannelRoom }>;
	};
	'/v1/livechat/room.survey': {
		POST: (params: POSTLivechatRoomSurveyParams) => { rid: string; data: unknown };
	};
	'/v1/livechat/visitors.pagesVisited/:roomId': {
		GET: (params: GETLivechatVisitorsPagesVisitedRoomIdParams) => PaginatedResult<{ pages: IMessage[] }>;
	};
	'/v1/livechat/visitors.chatHistory/room/:roomId/visitor/:visitorId': {
		GET: (params: GETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParams) => PaginatedResult<{ history: IOmnichannelRoom[] }>;
	};
	'/v1/livechat/visitors.searchChats/room/:roomId/visitor/:visitorId': {
		GET: (
			params: GETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParams,
		) => PaginatedResult<{ history: VisitorSearchChatsResult[] }>;
	};
	'/v1/livechat/visitors.autocomplete': {
		GET: (params: GETLivechatVisitorsAutocompleteParams) => {
			items: (ILivechatVisitor & {
				custom_name: string;
			})[];
		};
	};
	'/v1/livechat/agents/:agentId/departments': {
		GET: (params?: GETLivechatAgentsAgentIdDepartmentsParams) => {
			departments: (ILivechatDepartmentAgents & { departmentName: string })[];
		};
	};
	'/v1/livechat/business-hour': {
		GET: (params: GETBusinessHourParams) => { businessHour: ILivechatBusinessHour };
	};
	'/v1/livechat/triggers': {
		GET: (params: GETLivechatTriggersParams) => PaginatedResult<{ triggers: WithId<ILivechatTrigger>[] }>;
		POST: (params: POSTLivechatTriggersParams) => void;
	};
	'/v1/livechat/triggers/:_id': {
		GET: () => { trigger: ILivechatTrigger };
		DELETE: () => void;
	};
	'/v1/livechat/rooms': {
		GET: (params: GETLivechatRoomsParams) => PaginatedResult<{ rooms: IOmnichannelRoomWithDepartment[] }>;
	};
	'/v1/livechat/room/:rid/priority': {
		POST: (params: POSTLivechatRoomPriorityParams) => void;
		DELETE: () => void;
	};
	'/v1/livechat/queue': {
		GET: (params: GETLivechatQueueParams) => PaginatedResult<{
			queue: {
				_id: string;
				user: { _id: string; userId: string; username: string; status: string };
				department: { _id: string; name: string };
				chats: number;
			}[];
		}>;
	};
	'/v1/livechat/integrations.settings': {
		GET: () => { settings: ISetting[]; success: boolean };
	};
	'/v1/livechat/upload/:rid': {
		POST: (params: { file: File }) => IMessage & { newRoom: boolean; showConnecting: boolean };
	};
	'/v1/livechat/inquiries.list': {
		GET: (params: GETLivechatInquiriesListParams) => PaginatedResult<{ inquiries: ILivechatInquiryRecord[] }>;
	};
	'/v1/livechat/inquiries.take': {
		POST: (params: POSTLivechatInquiriesTakeParams) => { inquiry: ILivechatInquiryRecord };
	};
	'/v1/livechat/inquiries.queuedForUser': {
		GET: (params: GETLivechatInquiriesQueuedForUserParams) => PaginatedResult<{ inquiries: ILivechatInquiryRecord[] }>;
	};
	'/v1/livechat/inquiries.getOne': {
		GET: (params: GETLivechatInquiriesGetOneParams) => { inquiry: ILivechatInquiryRecord | null };
	};
	'/v1/livechat/analytics/dashboards/conversation-totalizers': {
		GET: (params: GETDashboardTotalizers) => {
			totalizers: { title: string; value: number }[];
		};
	};
	'/v1/livechat/analytics/dashboards/agents-productivity-totalizers': {
		GET: (params: GETDashboardTotalizers) => {
			totalizers: { title: string; value: number }[];
		};
	};
	'/v1/livechat/analytics/dashboards/chats-totalizers': {
		GET: (params: GETDashboardTotalizers) => {
			totalizers: { title: string; value: number }[];
		};
	};
	'/v1/livechat/analytics/dashboards/productivity-totalizers': {
		GET: (params: GETDashboardTotalizers) => {
			totalizers: { title: string; value: number }[];
		};
	};
	'/v1/livechat/analytics/dashboards/charts/chats': {
		GET: (params: GETDashboardTotalizers) => {
			open: number;
			closed: number;
			queued: number;
			onhold: number;
		};
	};
	'/v1/livechat/analytics/dashboards/charts/chats-per-agent': {
		GET: (params: GETDashboardTotalizers) => {
			[k: string]: { open: number; closed: number; onhold: number };
		};
	};
	'/v1/livechat/analytics/dashboards/charts/chats-per-department': {
		GET: (params: GETDashboardTotalizers) => {
			[k: string]: { open: number; closed: number };
		};
	};
	'/v1/livechat/analytics/dashboards/charts/timings': {
		GET: (params: GETDashboardTotalizers) => {
			response: { avg: number; longest: number };
			reaction: { avg: number; longest: number };
			chatDuration: { avg: number; longest: number };
		};
	};
	'/v1/livechat/analytics/dashboards/charts/agents-status': {
		GET: (params: GETDashboardsAgentStatusParams) => { offline: number; away: number; busy: number; available: number };
	};
	'/v1/livechat/rooms/filters': {
		GET: () => { filters: IOmnichannelRoom['source'][] };
	};
	'/v1/livechat/analytics/agent-overview': {
		GET: (params: LivechatAnalyticsAgentOverviewProps) => {
			head: { name: string }[];
			data: { name: string; value: number }[];
		};
	};
	'/v1/livechat/analytics/overview': {
		GET: (params: LivechatAnalyticsOverviewProps) => {
			title: string;
			value: string | number;
		}[];
	};
	'/v1/livechat/sms-incoming/:service': {
		POST: (params: unknown) => SMSProviderResponse;
	};
	'/v1/livechat/triggers/external-service/test': {
		POST: (params: LivechatTriggerWebhookTestParams) => ILivechatTriggerActionResponse;
	};
	'/v1/livechat/triggers/:_id/external-service/call': {
		POST: (params: LivechatTriggerWebhookCallParams) => ILivechatTriggerActionResponse;
	};
} & {
	// EE
	'/v1/livechat/analytics/agents/average-service-time': {
		GET: (params: LivechatAnalyticsAgentsAverageServiceTimeProps) => PaginatedResult<{
			agents: {
				_id: string;
				username: string;
				name: string;
				active: boolean;
				averageServiceTimeInSeconds: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/agents/total-service-time': {
		GET: (params: LivechatAnalyticsAgentsTotalServiceTimeProps) => PaginatedResult<{
			agents: {
				_id: string;
				username: string;
				chats: number;
				serviceTimeDuration: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/agents/available-for-service-history': {
		GET: (params: LivechatAnalyticsAgentsAvailableForServiceHistoryProps) => PaginatedResult<{
			agents: ILivechatAgentActivity[];
		}>;
	};
	'/v1/livechat/analytics/departments/amount-of-chats': {
		GET: (params: LivechatAnalyticsDepartmentsAmountOfChatsProps) => PaginatedResult<{
			departments: IOmnichannelRoom[];
		}>;
	};
	'/v1/livechat/analytics/departments/average-service-time': {
		GET: (params: LivechatAnalyticsDepartmentsAverageServiceTimeProps) => PaginatedResult<{
			departments: {
				_id: string;
				averageServiceTimeInSeconds: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/departments/average-chat-duration-time': {
		GET: (params: LivechatAnalyticsDepartmentsAverageChatDurationTimeProps) => PaginatedResult<{
			departments: {
				_id: string;
				averageChatDurationTimeInSeconds: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/departments/total-service-time': {
		GET: (params: LivechatAnalyticsDepartmentsTotalServiceTimeProps) => PaginatedResult<{
			departments: {
				_id: string;
				serviceTimeDuration: number;
				chats: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/departments/average-waiting-time': {
		GET: (params: LivechatAnalyticsDepartmentsAverageWaitingTimeProps) => PaginatedResult<{
			departments: {
				_id: string;
				averageWaitingTimeInSeconds: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/departments/total-transferred-chats': {
		GET: (params: LivechatAnalyticsDepartmentsTotalTransferredChatsProps) => PaginatedResult<{
			departments: {
				_id: string;
				numberOfTransferredRooms: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/departments/total-abandoned-chats': {
		GET: (params: LivechatAnalyticsDepartmentsTotalAbandonedChatsProps) => PaginatedResult<{
			departments: {
				_id: string;
				abandonedRooms: number;
			}[];
		}>;
	};
	'/v1/livechat/analytics/departments/percentage-abandoned-chats': {
		GET: (params: LivechatAnalyticsDepartmentsPercentageAbandonedChatsProps) => PaginatedResult<{
			departments: {
				_id: string;
				percentageOfAbandonedRooms: number;
			}[];
		}>;
	};
	'/v1/omnichannel/:rid/request-transcript': {
		POST: () => void;
	};
	'/v1/omnichannel/integrations': {
		POST: (params: POSTomnichannelIntegrations) => void;
	};
	'/v1/livechat/inquiry.setSLA': {
		PUT: (params: { roomId: string; sla: string }) => void;
	};
	'/v1/livechat/analytics/dashboards/conversations-by-source': {
		GET: (params: GETDashboardConversationsByType) => ReportResult;
	};
	'/v1/livechat/analytics/dashboards/conversations-by-status': {
		GET: (params: GETDashboardConversationsByType) => ReportResult;
	};
	'/v1/livechat/analytics/dashboards/conversations-by-department': {
		GET: (params: GETDashboardConversationsByType) => ReportWithUnmatchingElements;
	};
	'/v1/livechat/analytics/dashboards/conversations-by-tags': {
		GET: (params: GETDashboardConversationsByType) => ReportWithUnmatchingElements;
	};
	'/v1/livechat/analytics/dashboards/conversations-by-agent': {
		GET: (params: GETDashboardConversationsByType) => ReportWithUnmatchingElements;
	};
	'/v1/livechat/webhook.test': {
		POST: () => void;
	};
};
