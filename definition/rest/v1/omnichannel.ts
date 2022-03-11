import Ajv, { JSONSchemaType } from 'ajv';

import { ILivechatAgent } from '../../ILivechatAgent';
import { ILivechatDepartment } from '../../ILivechatDepartment';
import { ILivechatDepartmentAgents } from '../../ILivechatDepartmentAgents';
import { ILivechatMonitor } from '../../ILivechatMonitor';
import { ILivechatTag } from '../../ILivechatTag';
import { ILivechatVisitor, ILivechatVisitorDTO } from '../../ILivechatVisitor';
import { IMessage } from '../../IMessage';
import { IOmnichannelRoom, IRoom } from '../../IRoom';
import { ISetting } from '../../ISetting';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

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

export const isLivechatVisitorsInfo = ajv.compile(LivechatVisitorsInfoSchema);

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

export const isLivechatRoomOnHold = ajv.compile(LivechatRoomOnHoldSchema);

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

export const isLivechatDepartmentId = ajv.compile(LivechatDepartmentIdSchema);

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

export const isLivechatDepartmentAutocomplete = ajv.compile(LivechatDepartmentAutocompleteSchema);

type livechatDepartmentDepartmentIdAgents = {
	sort: string;
};

const livechatDepartmentDepartmentIdAgentsSchema: JSONSchemaType<livechatDepartmentDepartmentIdAgents> = {
	type: 'object',
	properties: {
		sort: {
			type: 'string',
		},
	},
	required: ['sort'],
	additionalProperties: false,
};

export const islivechatDepartmentDepartmentIdAgents = ajv.compile(livechatDepartmentDepartmentIdAgentsSchema);

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

export const isLivechatVisitorTokenGet = ajv.compile(LivechatVisitorTokenGetSchema);

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

export const isLivechatVisitorTokenDelete = ajv.compile(LivechatVisitorTokenDeleteSchema);

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

export const isLivechatVisitorTokenRoom = ajv.compile(LivechatVisitorTokenRoomSchema);

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

export const isLivechatVisitorCallStatus = ajv.compile(LivechatVisitorCallStatusSchema);

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

export const isLivechatVisitorStatus = ajv.compile(LivechatVisitorStatusSchema);

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
	'livechat/monitors.list': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			monitors: ILivechatMonitor[];
		}>;
	};
	'livechat/tags.list': {
		GET: (params: PaginatedRequest<{ text: string }, 'name'>) => PaginatedResult<{
			tags: ILivechatTag[];
		}>;
	};
	'livechat/department': {
		GET: (
			params: PaginatedRequest<{
				text: string;
				onlyMyDepartments?: booleanString;
				enabled?: boolean;
				excludeDepartmentId?: string;
			}>,
		) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
		POST: (params: { department: Partial<ILivechatDepartment>; agents: string[] }) => {
			department: ILivechatDepartment;
			agents: any[];
		};
	};
	'livechat/department/:_id': {
		GET: (params: LivechatDepartmentId) => {
			department: ILivechatDepartment | null;
			agents?: any[];
		};
		PUT: (params: { department: Partial<ILivechatDepartment>[]; agents: any[] }) => {
			department: ILivechatDepartment;
			agents: any[];
		};
		DELETE: () => void;
	};
	'livechat/department.autocomplete': {
		GET: (params: LivechatDepartmentAutocomplete) => {
			items: ILivechatDepartment[];
		};
	};
	'livechat/department/:departmentId/agents': {
		GET: (params: livechatDepartmentDepartmentIdAgents) => PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>;
		POST: (params: { upsert: string[]; remove: string[] }) => void;
	};
	'livechat/departments.available-by-unit/:id': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'livechat/departments.by-unit/': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'livechat/departments.by-unit/:id': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'livechat/department.listByIds': {
		GET: (params: { ids: string[]; fields?: Record<string, unknown> }) => { departments: ILivechatDepartment[] };
	};

	'livechat/custom-fields': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			customFields: [
				{
					_id: string;
					label: string;
				},
			];
		}>;
	};
	'livechat/rooms': {
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
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'livechat/users/agent': {
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

	'livechat/visitor': {
		POST: (params: { visitor: ILivechatVisitorDTO }) => { visitor: ILivechatVisitor };
	};

	'livechat/visitor/:token': {
		GET: (params: LivechatVisitorTokenGet) => { visitor: ILivechatVisitor };
		DELETE: (params: LivechatVisitorTokenDelete) => { visitor: { _id: string; ts: string } };
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
		POST: (params: LivechatVisitorStatus) => { token: string; status: string };
	};

	'livechat/queue': {
		GET: (params: {
			agentId?: ILivechatAgent['_id'];
			includeOfflineAgents?: boolean;
			departmentId?: ILivechatAgent['_id'];
			offset: number;
			count: number;
			sort: string;
		}) => {
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
};
