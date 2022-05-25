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
} from '@rocket.chat/core-typings';
import Ajv, { JSONSchemaType } from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type booleanString = 'true' | 'false';

const ajv = new Ajv();

type LivechatVisitorsInfo = {
	visitorId: string;
};

const LivechatVisitorsInfoSchema: JSONSchemaType<LivechatVisitorsInfo> = {
	type: 'object',
	properties: {
		visitorId: {
			type: 'string',
		},
	},
	required: ['visitorId'],
	additionalProperties: false,
};

export const isLivechatVisitorsInfoProps = ajv.compile(LivechatVisitorsInfoSchema);

type LivechatRoomOnHold = {
	roomId: IRoom['_id'];
};

const LivechatRoomOnHoldSchema: JSONSchemaType<LivechatRoomOnHold> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isLivechatRoomOnHoldProps = ajv.compile(LivechatRoomOnHoldSchema);

type LivechatDepartmentId = {
	onlyMyDepartments?: booleanString;
	includeAgents?: booleanString;
};

const LivechatDepartmentIdSchema: JSONSchemaType<LivechatDepartmentId> = {
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

export const isLivechatDepartmentIdProps = ajv.compile(LivechatDepartmentIdSchema);

type LivechatDepartmentAutocomplete = {
	selector: string;
	onlyMyDepartments: booleanString;
};

const LivechatDepartmentAutocompleteSchema: JSONSchemaType<LivechatDepartmentAutocomplete> = {
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

export const isLivechatDepartmentAutocompleteProps = ajv.compile(LivechatDepartmentAutocompleteSchema);

type LivechatDepartmentDepartmentIdAgentsGET = {
	sort: string;
};

const LivechatDepartmentDepartmentIdAgentsGETSchema: JSONSchemaType<LivechatDepartmentDepartmentIdAgentsGET> = {
	type: 'object',
	properties: {
		sort: {
			type: 'string',
		},
	},
	required: ['sort'],
	additionalProperties: false,
};

export const isLivechatDepartmentDepartmentIdAgentsGETProps = ajv.compile(LivechatDepartmentDepartmentIdAgentsGETSchema);

type LivechatDepartmentDepartmentIdAgentsPOST = {
	upsert: string[];
	remove: string[];
};

const LivechatDepartmentDepartmentIdAgentsPOSTSchema: JSONSchemaType<LivechatDepartmentDepartmentIdAgentsPOST> = {
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

export const isLivechatDepartmentDepartmentIdAgentsPOSTProps = ajv.compile(LivechatDepartmentDepartmentIdAgentsPOSTSchema);

type LivechatVisitorTokenGet = {
	token: string;
};

const LivechatVisitorTokenGetSchema: JSONSchemaType<LivechatVisitorTokenGet> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatVisitorTokenGetProps = ajv.compile(LivechatVisitorTokenGetSchema);

type LivechatVisitorTokenDelete = {
	token: string;
};

const LivechatVisitorTokenDeleteSchema: JSONSchemaType<LivechatVisitorTokenDelete> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatVisitorTokenDeleteProps = ajv.compile(LivechatVisitorTokenDeleteSchema);

type LivechatVisitorTokenRoom = {
	token: string;
};

const LivechatVisitorTokenRoomSchema: JSONSchemaType<LivechatVisitorTokenRoom> = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
		},
	},
	required: ['token'],
	additionalProperties: false,
};

export const isLivechatVisitorTokenRoomProps = ajv.compile(LivechatVisitorTokenRoomSchema);

type LivechatVisitorCallStatus = {
	token: string;
	callStatus: string;
	rid: string;
	callId: string;
};

const LivechatVisitorCallStatusSchema: JSONSchemaType<LivechatVisitorCallStatus> = {
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

export const isLivechatVisitorCallStatusProps = ajv.compile(LivechatVisitorCallStatusSchema);

type LivechatVisitorStatus = {
	token: string;
	status: string;
};

const LivechatVisitorStatusSchema: JSONSchemaType<LivechatVisitorStatus> = {
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

export const isLivechatVisitorStatusProps = ajv.compile(LivechatVisitorStatusSchema);

type LiveChatRoomJoin = {
	roomId: string;
};

const LiveChatRoomJoinSchema: JSONSchemaType<LiveChatRoomJoin> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isLiveChatRoomJoinProps = ajv.compile(LiveChatRoomJoinSchema);

type LivechatMonitorsListProps = PaginatedRequest<{ text: string }>;

const LivechatMonitorsListSchema: JSONSchemaType<LivechatMonitorsListProps> = {
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

export const isLivechatMonitorsListProps = ajv.compile(LivechatMonitorsListSchema);

type LivechatTagsListProps = PaginatedRequest<{ text: string }, 'name'>;

const LivechatTagsListSchema: JSONSchemaType<LivechatTagsListProps> = {
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

export const isLivechatTagsListProps = ajv.compile(LivechatTagsListSchema);

type LivechatDepartmentProps = PaginatedRequest<{
	text: string;
	onlyMyDepartments?: booleanString;
	enabled?: booleanString;
	excludeDepartmentId?: string;
}>;

const LivechatDepartmentSchema: JSONSchemaType<LivechatDepartmentProps> = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
		},
		onlyMyDepartments: {
			type: 'string',
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
	},
	required: ['text'],
	additionalProperties: false,
};

export const isLivechatDepartmentProps = ajv.compile(LivechatDepartmentSchema);

type LivechatDepartmentsAvailableByUnitIdProps = PaginatedRequest<{ text: string }>;

const LivechatDepartmentsAvailableByUnitIdSchema: JSONSchemaType<LivechatDepartmentsAvailableByUnitIdProps> = {
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

export const isLivechatDepartmentsAvailableByUnitIdProps = ajv.compile(LivechatDepartmentsAvailableByUnitIdSchema);

type LivechatDepartmentsByUnitProps = PaginatedRequest<{ text: string }>;

const LivechatDepartmentsByUnitSchema: JSONSchemaType<LivechatDepartmentsByUnitProps> = {
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

export const isLivechatDepartmentsByUnitProps = ajv.compile(LivechatDepartmentsByUnitSchema);

type LivechatDepartmentsByUnitIdProps = PaginatedRequest<{ text: string }>;

const LivechatDepartmentsByUnitIdSchema: JSONSchemaType<LivechatDepartmentsByUnitIdProps> = {
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

export const isLivechatDepartmentsByUnitIdProps = ajv.compile(LivechatDepartmentsByUnitIdSchema);

type LivechatUsersManagerGETProps = PaginatedRequest<{ text: string }>;

const LivechatUsersManagerGETSchema: JSONSchemaType<LivechatUsersManagerGETProps> = {
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

export const isLivechatUsersManagerGETProps = ajv.compile(LivechatUsersManagerGETSchema);

type LivechatUsersManagerPOSTProps = PaginatedRequest<{ username: string }>;

const LivechatUsersManagerPOSTSchema: JSONSchemaType<LivechatUsersManagerPOSTProps> = {
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

export const isLivechatUsersManagerPOSTProps = ajv.compile(LivechatUsersManagerPOSTSchema);

type LivechatQueueProps = {
	agentId?: string;
	includeOfflineAgents?: booleanString;
	departmentId?: string;
	offset: number;
	count: number;
	sort: string;
};

const LivechatQueuePropsSchema: JSONSchemaType<LivechatQueueProps> = {
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

export const isLivechatQueueProps = ajv.compile(LivechatQueuePropsSchema);

type CannedResponsesProps = PaginatedRequest<{
	scope?: string;
	departmentId?: string;
	text?: string;
}>;

const CannedResponsesPropsSchema: JSONSchemaType<CannedResponsesProps> = {
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

export const isCannedResponsesProps = ajv.compile(CannedResponsesPropsSchema);

type LivechatCustomFieldsProps = PaginatedRequest<{ text: string }>;

const LivechatCustomFieldsSchema: JSONSchemaType<LivechatCustomFieldsProps> = {
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

export const isLivechatCustomFieldsProps = ajv.compile(LivechatCustomFieldsSchema);

export type OmnichannelEndpoints = {
	'livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
		};
	};
	'livechat/visitors.info': {
		GET: (params: LivechatVisitorsInfo) => {
			visitor: {
				visitorEmails: Array<{
					address: string;
				}>;
			};
		};
	};
	'livechat/room.onHold': {
		POST: (params: LivechatRoomOnHold) => void;
	};
	'livechat/room.join': {
		GET: (params: LiveChatRoomJoin) => { success: boolean };
	};
	'livechat/monitors.list': {
		GET: (params: LivechatMonitorsListProps) => PaginatedResult<{
			monitors: ILivechatMonitor[];
		}>;
	};
	'livechat/tags.list': {
		GET: (params: LivechatTagsListProps) => PaginatedResult<{
			tags: ILivechatTag[];
		}>;
	};
	'livechat/department': {
		GET: (params: LivechatDepartmentProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
		POST: (params: { department: Partial<ILivechatDepartment>; agents: string[] }) => {
			department: ILivechatDepartment;
			agents: any[];
		};
	};
	'livechat/department/:_id': {
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
	'livechat/department.autocomplete': {
		GET: (params: LivechatDepartmentAutocomplete) => {
			items: ILivechatDepartment[];
		};
	};
	'livechat/department/:departmentId/agents': {
		GET: (params: LivechatDepartmentDepartmentIdAgentsGET) => PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>;
		POST: (params: LivechatDepartmentDepartmentIdAgentsPOST) => void;
	};
	'livechat/departments.available-by-unit/:id': {
		GET: (params: LivechatDepartmentsAvailableByUnitIdProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'livechat/departments.by-unit/': {
		GET: (params: LivechatDepartmentsByUnitProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'livechat/departments.by-unit/:id': {
		GET: (params: LivechatDepartmentsByUnitIdProps) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'livechat/department.listByIds': {
		GET: (params: { ids: string[]; fields?: Record<string, unknown> }) => {
			departments: ILivechatDepartment[];
		};
	};

	'livechat/custom-fields': {
		GET: (params: LivechatCustomFieldsProps) => PaginatedResult<{
			customFields: [
				{
					_id: string;
					label: string;
				},
			];
		}>;
	};
	'livechat/rooms': {
		// TO-DO
		GET: (params: {
			guest: string;
			fname: string;
			servedBy: string[];
			status: string;
			department: string;
			from: string;
			to: string;
			customFields: any;
			current: number;
			itemsPerPage: number;
			tags: string[];
		}) => PaginatedResult<{
			rooms: IOmnichannelRoom[];
		}>;
	};
	'livechat/:rid/messages': {
		// TO-DO
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'livechat/users/agent': {
		// TO-DO
		GET: (params: PaginatedRequest<{ text?: string }>) => PaginatedResult<{
			users: {
				_id: string;
				emails: {
					address: string;
					verified: boolean;
				}[];
				status: string;
				name: string;
				username: string;
				statusLivechat: string;
				livechat: {
					maxNumberSimultaneousChat: number;
				};
			}[];
		}>;
	};

	'livechat/users/manager/:_id': {
		DELETE: () => { success: boolean };
	};

	'livechat/users/manager': {
		GET: (params: LivechatUsersManagerGETProps) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: LivechatUsersManagerPOSTProps) => { success: boolean };
	};

	'livechat/visitor': {
		POST: (params: { visitor: ILivechatVisitorDTO }) => {
			visitor: ILivechatVisitor;
		};
	};

	'livechat/visitor/:token': {
		GET: (params: LivechatVisitorTokenGet) => { visitor: ILivechatVisitor };
		DELETE: (params: LivechatVisitorTokenDelete) => {
			visitor: { _id: string; ts: string };
		};
	};

	'livechat/visitor/:token/room': {
		GET: (params: LivechatVisitorTokenRoom) => { rooms: IOmnichannelRoom[] };
	};

	'livechat/visitor.callStatus': {
		POST: (params: LivechatVisitorCallStatus) => {
			token: string;
			callStatus: string;
		};
	};

	'livechat/visitor.status': {
		POST: (params: LivechatVisitorStatus) => {
			token: string;
			status: string;
		};
	};

	'livechat/queue': {
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
	'livechat/agents/:uid/departments?enabledDepartmentsOnly=true': {
		GET: () => { departments: ILivechatDepartment[] };
	};

	'canned-responses': {
		GET: (params: CannedResponsesProps) => PaginatedResult<{
			cannedResponses: IOmnichannelCannedResponse[];
		}>;
	};
};
