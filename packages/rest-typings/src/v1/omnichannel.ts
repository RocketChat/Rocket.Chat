import type {
	IOmnichannelCannedResponse,
	ILivechatAgent,
	ILivechatDepartment,
	ILivechatDepartmentRecord,
	ILivechatDepartmentAgents,
	ILivechatMonitor,
	ILivechatTag,
	ILivechatVisitor,
	ILivechatVisitorDTO,
	IMessage,
	IOmnichannelRoom,
	IRoom,
	ISetting,
	ILivechatBusinessHour,
	SettingValue,
	IBusinessHourWorkHour,
	ILivechatCustomField,
	ILivechatInquiryRecord,
	ILivechatTrigger,
	IConversationTotalizers,
	IAgentProductivityTotalizers,
	IChatTotalizers,
	IProductivityTotalizers,
} from '@rocket.chat/core-typings';
import Ajv, { JSONSchemaType } from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type booleanString = 'true' | 'false';

const ajv = new Ajv({
	coerceTypes: true,
});

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
	upsert: string[];
	remove: string[];
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

type LivechatTagsListProps = PaginatedRequest<{ text: string }, 'name'>;

const LivechatTagsListSchema = {
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

export const isLivechatTagsListProps = ajv.compile<LivechatTagsListProps>(LivechatTagsListSchema);

type LivechatDepartmentProps = PaginatedRequest<{
	text: string;
	onlyMyDepartments?: booleanString;
	enabled?: booleanString;
	excludeDepartmentId?: string;
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
	additionalProperties: false,
};

export const isLivechatDepartmentProps = ajv.compile<LivechatDepartmentProps>(LivechatDepartmentSchema);

type LivechatDepartmentsAvailableByUnitIdProps = PaginatedRequest<{ text: string }>;

const LivechatDepartmentsAvailableByUnitIdSchema = {
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

type LivechatDepartmentsByUnitIdProps = PaginatedRequest<{ text: string }>;

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

type LivechatUsersManagerGETProps = PaginatedRequest<{ text?: string }>;

const LivechatUsersManagerGETSchema = {
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

export const isCannedResponsesProps = ajv.compile<CannedResponsesProps>(CannedResponsesPropsSchema);

type LivechatCustomFieldsProps = PaginatedRequest<{ text: string }>;

const LivechatCustomFieldsSchema = {
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

export const isLivechatCustomFieldsProps = ajv.compile<LivechatCustomFieldsProps>(LivechatCustomFieldsSchema);

type LivechatRoomsProps = PaginatedRequest<{
	agents: string[];
	customFields: any;
	createdAt: string;
	closedAt: string;
	departmentId: string;
	open: booleanString;
	onhold: booleanString;
	tags: string[];
	roomName: string;
}>;

const LivechatRoomsSchema: JSONSchemaType<LivechatRoomsProps> = {
	type: 'object',
	properties: {
		agents: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
		},
		createdAt: {
			type: 'string',
			nullable: true,
		},
		closedAt: {
			type: 'string',
			nullable: true,
		},
		departmentId: {
			type: 'string',
			nullable: true,
		},
		open: {
			type: 'string',
			nullable: true,
		},
		onhold: {
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
		roomName: {
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

export const isLivechatRoomsProps = ajv.compile<LivechatRoomsProps>(LivechatRoomsSchema);

type LivechatRidMessagesProps = PaginatedRequest<{ query: string }>;

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
		query: {
			type: 'string',
		},
	},
	required: ['query'],
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

export type OmnichannelEndpoints = {
	'/v1/livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
		};
	};
	'/v1/livechat/visitors.info': {
		GET: (params: LivechatVisitorsInfo) => {
			visitor: ILivechatVisitor;
		};
	};
	'/v1/livechat/room': {
		GET: (params: { token: string; rid: IRoom['_id'] }) => {
			room: IOmnichannelRoom;
		};
	};
	'/v1/livechat/room.onHold': {
		POST: (params: LivechatRoomOnHold) => void;
	};
	'/v1/livechat/room.join': {
		GET: (params: LiveChatRoomJoin) => { success: boolean };
	};
	'/v1/livechat/monitors.list': {
		GET: (params: LivechatMonitorsListProps) => PaginatedResult<{
			monitors: ILivechatMonitor[];
		}>;
	};
	'/v1/livechat/tags.list': {
		GET: (params: LivechatTagsListProps) => PaginatedResult<{
			tags: ILivechatTag[];
		}>;
	};
	'/v1/livechat/department': {
		GET: (params: LivechatDepartmentProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
		POST: (params: { department: Partial<ILivechatDepartment>; agents: string[] }) => {
			department: ILivechatDepartment;
			agents: any[];
		};
	};
	'/v1/livechat/department/:_id': {
		GET: (params: LivechatDepartmentId) => {
			department: ILivechatDepartmentRecord | null;
			agents?: ILivechatDepartmentAgents[];
		};
		PUT: (params: { department: Partial<ILivechatDepartment>[]; agents: any[] }) => {
			department: ILivechatDepartment;
			agents: ILivechatDepartmentAgents[];
		};
		DELETE: () => void;
	};
	'/v1/livechat/department.autocomplete': {
		GET: (params: LivechatDepartmentAutocomplete) => {
			items: ILivechatDepartment[];
		};
	};
	'/v1/livechat/department/:departmentId/agents': {
		GET: (params: LivechatDepartmentDepartmentIdAgentsGET) => PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>;
		POST: (params: LivechatDepartmentDepartmentIdAgentsPOST) => void;
	};
	'/v1/livechat/departments.available-by-unit/:id': {
		GET: (params: LivechatDepartmentsAvailableByUnitIdProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'/v1/livechat/departments.by-unit/': {
		GET: (params: LivechatDepartmentsByUnitProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'/v1/livechat/departments.by-unit/:id': {
		GET: (params: LivechatDepartmentsByUnitIdProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'/v1/livechat/department.listByIds': {
		GET: (params: { ids: string[]; fields?: Record<string, unknown> }) => {
			departments: ILivechatDepartment[];
		};
	};

	'/v1/livechat/custom-fields': {
		GET: (params: LivechatCustomFieldsProps) => PaginatedResult<{
			customFields: [
				{
					_id: string;
					label: string;
				},
			];
		}>;
	};
	'/v1/livechat/rooms': {
		GET: (params: LivechatRoomsProps) => PaginatedResult<{
			rooms: IOmnichannelRoom[];
		}>;
	};
	'/v1/livechat/:rid/messages': {
		GET: (params: LivechatRidMessagesProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};

	'/v1/livechat/users/manager': {
		GET: (params: LivechatUsersManagerGETProps) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: { username: string }) => { success: boolean };
	};

	'/v1/livechat/users/manager/:_id': {
		GET: (
			params: PaginatedRequest<{
				text: string;
			}>,
		) => { user: ILivechatAgent };
		DELETE: () => void;
	};

	'/v1/livechat/users/agent': {
		GET: (params: PaginatedRequest<{ text?: string }>) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: LivechatUsersManagerPOSTProps) => { success: boolean };
	};

	'/v1/livechat/users/agent/:_id': {
		GET: (
			params: PaginatedRequest<{
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
		GET: (params: LivechatVisitorTokenGet) => { visitor: ILivechatVisitor };
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

	'/v1/livechat/queue': {
		GET: (params: LivechatQueueProps) => {
			queue: {
				chats: number;
				department: { _id: string; name: string };
				user: { _id: string; username: string; status: string };
			}[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/livechat/agents/:uid/departments': {
		GET: (params: { enableDepartmentsOnly: 'true' | 'false' | '0' | '1' }) => { departments: ILivechatDepartmentAgents[] };
	};

	'/v1/canned-responses': {
		GET: (params: CannedResponsesProps) => PaginatedResult<{
			cannedResponses: IOmnichannelCannedResponse[];
		}>;
	};

	'livechat/agents/:agentId/departments': {
		GET: (params: { agentId: string; enabledDepartmentsOnly?: string }) => { departments: ILivechatDepartmentAgents[] };
	};

	'livechat/business-hour': {
		GET: (params: { _id: string; type: string }) => {
			businessHour: ILivechatBusinessHour;
		};
	};

	'livechat/analytics/dashboards/conversation-totalizers': {
		GET: (params: { start: string; end: string; departmentId?: string }) => IConversationTotalizers;
	};

	'livechat/analytics/dashboards/agents-productivity-totalizers': {
		GET: (params: { start: string; end: string; departmentId?: string }) => IAgentProductivityTotalizers;
	};

	'livechat/analytics/dashboards/chats-totalizers': {
		GET: (params: { start: string; end: string; departmentId?: string }) => IChatTotalizers;
	};

	'livechat/analytics/dashboards/productivity-totalizers': {
		GET: (params: { start: string; end: string; departmentId?: string }) => IProductivityTotalizers;
	};

	'livechat/analytics/dashboards/charts/chats': {
		GET: (params: { start: string; end: string; departmentId?: string }) => {
			open: number;
			closed: number;
			queued: number;
			onhold: number;
		};
	};

	'livechat/analytics/dashboards/charts/chats-per-agent': {
		GET: (params: { start: string; end: string; departmentId?: string }) => {
			[agentId: string]: {
				open: number;
				closed: number;
				onhold: number;
			};
		};
	};

	'livechat/analytics/dashboards/charts/agents-status': {
		GET: (params: { departmentId?: string }) => {
			offline: number;
			away: number;
			busy: number;
			available: number;
		};
	};

	'livechat/analytics/dashboards/charts/chats-per-department': {
		GET: (params: { start: string; end: string; departmentId?: string }) => {
			[departmentName: string]: {
				open: number;
				closed: number;
			};
		};
	};

	'livechat/analytics/dashboards/charts/timings': {
		GET: (params: { start: string; end: string; departmentId?: string }) => {
			response: {
				avg: number;
				longest: number;
			};
			reaction: {
				avg: number;
				longest: number;
			};
			chatDuration: {
				avg: number;
				longest: number;
			};
		};
	};

	'livechat/inquiries.list': {
		GET: (params: { department: string }) => PaginatedResult<{ inquiries: ILivechatInquiryRecord[] }>;
	};

	'livechat/inquiries.take': {
		POST: (params: { userId?: string; inquiryId: string }) => { inquiry: IOmnichannelRoom };
	};

	'livechat/inquiries.queued': {
		GET: (params: { department: string }) => PaginatedResult<{ inquiries: ILivechatInquiryRecord[] }>;
	};

	'livechat/inquiries.getOne': {
		GET: (params: { roomId: string }) => { inquiry: ILivechatInquiryRecord | null };
	};

	'livechat/integrations.settings': {
		GET: () => { settings: ISetting[] };
	};

	'livechat/office-hours': {
		GET: (params: {}) => { officeHours: IBusinessHourWorkHour[] | undefined };
	};
	'livechat/sms-incoming/:service': {
		POST: (params: { service: any; sms: any; department: string }) => {};
	};

	'livechat/triggers': {
		GET: (params: { _id: string }) => { triggers: ILivechatTrigger[] };
	};

	'livechat/triggers/:_id': {
		GET: (params: { _id: string }) => { trigger: ILivechatTrigger | null };
	};

	'livechat/upload/:rid': {
		POST: (params: { rid: string }) => {};
	};

	'livechat/users/:type': {
		GET: (params: { type: string; text: string }) => { users: ILivechatAgent[] };
		POST: (params: { type: string; username: string }) => { user: ILivechatAgent };
	};

	'livechat/users/:type/:_id': {
		GET: (params: { type: string; _id: string }) => { user: any };
		DELETE: (params: { type: string; _id: string; username: string }) => void;
	};

	'livechat/agent.info/:rid/:token': {
		GET: (params: { rid: string; token: string }) => { agent: ILivechatAgent };
	};

	'livechat/agent.next/:token': {
		GET: (params: { token: string; department?: string }) => { agent: ILivechatAgent } | void;
	};

	'livechat/config': {
		GET: (params: { token: string; department?: string; businessUnit: string }) => { config: any };
	};

	'omnichannel/contact': {
		POST: (params: {
			_id?: string;
			token: string;
			name: string;
			username: string;
			email?: string;
			phone?: string;
			customFields?: any[];
			contactManager?: any;
		}) => { contact: string };

		GET: (params: { contactId: string }) => { contact: ILivechatVisitor };
	};

	'omnichannel/contact.search': {
		GET: (params: { email?: string; phone?: string }) => { contact: ILivechatVisitor };
	};

	'livechat/custom.field': {
		POST: (params: { token: string; key: string; value: string; overwrite: boolean }) => {
			field: { key: string; value: string; overwrite: boolean };
		};
	};

	'livechat/custom.fields': {
		POST: (params: { token: string; customFields: { key: string; value: string; overwrite: boolean } }) => {
			fields: {
				Key: string;
				value: string;
				overwrite: boolean;
			}[];
		};
	};

	'livechat/custom-fields/:_id': {
		GET: (params: { id: string }) => { customField: ILivechatCustomField | null };
	};

	'livechat/message': {
		POST: (params: { _id?: string; token: string; rid: string; msg: string; agent: { agentId: string; username: string } }) => {
			message: IMessage;
		};
	};

	'livechat/message/:_id': {
		GET: (params: { _id: string; token: string; rid: string }) => { message: IMessage };
		PUT: (params: { _id: string; token: string; rid: string; msg: string }) => { message: IMessage };
		DELETE: (params: { _id: string; token: string; rid: string }) => {
			message: {
				_id: string;
				ts: string;
			};
		};
	};

	'livechat/messages.history/:rid': {
		GET: (params: { rid: string; searchText: { text: string }; token: string; ls: string; end: string; limit: string }) => {
			messages: IMessage[];
		};
	};

	'livechat/messages': {
		POST: (params: { visitor: { token: string }; messages: { msg: string }[] }) => {
			messages: { username: string; msg: string; ts: string }[];
		};
	};

	'livechat/offline.message': {
		POST: (params: { name: string; email: string; message: string; department?: string; host?: string }) => { message: string };
	};

	'livechat/room.close': {
		POST: (params: { rid: string; token: string }) => { rid: string; comment: string };
	};

	'livechat/room.transfer': {
		POST: (params: { rid: string; token: string; department: string }) => { room: IOmnichannelRoom };
	};

	'livechat/room.visitor': {
		PUT: (params: { rid: string; oldVisitorId: string; newVisitorId: string }) => { room: IOmnichannelRoom };
	};

	'livechat/transcript': {
		POST: (params: { token: string; rid: string; email: string; user: any; subject: string }) => { message: string };
	};

	'livechat/transfer.history/:rid': {
		GET: (params: { rid: string }) => PaginatedResult<{ history: number[] }>;
	};

	'livechat/video.call/:token': {
		GET: (params: { token: string; rid?: string }) => {
			videoCall: {
				rid: string;
				domain: SettingValue;
				provider: string;
				room: string;
				timeout: string;
			};
		};
	};

	'livechat/webrtc.call': {
		GET: (params: { rid?: string }) => { videoCall: { rid: any; provider: string; callStatus: any } };
	};

	'livechat/webrtc.call/:callId': {
		PUT: (params: { callId: string; rid?: string; status?: string }) => { status: string | undefined };
	};

	'livechat/facebook': {
		POST: (params: {
			mid: string;
			page: string;
			token: string;
			first_name: string;
			last_name: string;
			text: string;
			attachments: any[];
		}) => { success: boolean; error?: string; message?: any };
	};

	'livechat/visitors.pagesVisited/:roomId': {
		GET: (params: PaginatedRequest<{ roomId?: string }>) => PaginatedResult<{ pages: IMessage[] }>;
	};

	'livechat/visitors.chatHistory/room/:roomId/visitor/:visitorId': {
		GET: (params: PaginatedRequest<{ roomId?: string; visitorId?: string }>) => PaginatedResult<{ history: IMessage[] }>;
	};

	'livechat/visitors.searchChats/room/:roomId/visitor/:visitorId': {
		GET: (
			params: PaginatedRequest<{
				roomId?: string;
				visitorId?: string;
				searchText?: string;
				closedChatsOnly?: booleanString;
				servedChatsOnly?: booleanString;
			}>,
		) => PaginatedResult<{ history: IMessage[] }>;
	};

	'livechat/visitors.autocomplete': {
		GET: (params: { selector: string }) => {
			items: Array<Pick<ILivechatVisitor, '_id' | 'name' | 'username'>>;
		};
	};

	'livechat/visitors.search': {
		GET: (params: PaginatedRequest<{ term: string }>) => PaginatedResult<{
			visitors: ILivechatVisitor[];
		}>;
	};
};
