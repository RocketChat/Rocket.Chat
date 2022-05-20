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

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type booleanString = 'true' | 'false';

export type OmnichannelEndpoints = {
	'/v1/livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
		};
	};
	'/v1/livechat/visitors.info': {
		GET: (params: { visitorId: string }) => {
			visitor: {
				visitorEmails: Array<{
					address: string;
				}>;
			};
		};
	};
	'/v1/livechat/room.onHold': {
		POST: (params: { roomId: IRoom['_id'] }) => void;
	};
	'/v1/livechat/room.join': {
		GET: (params: { roomId: IRoom['_id'] }) => void;
	};
	'/v1/livechat/room.info': {
		GET: (params: { roomId: IRoom['_id'] }) => {
			room: IOmnichannelRoom;
		};
	};
	'/v1/livechat/room': {
		GET: (params: { token: string; rid: IRoom['_id'] }) => {
			room: IOmnichannelRoom;
		};
	};
	'/v1/livechat/monitors.list': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			monitors: ILivechatMonitor[];
		}>;
	};
	'/v1/livechat/tags.list': {
		GET: (params: PaginatedRequest<{ text: string }, 'name'>) => PaginatedResult<{
			tags: ILivechatTag[];
		}>;
	};
	'/v1/livechat/department': {
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
	'/v1/livechat/department/:_id': {
		GET: (params: { onlyMyDepartments?: booleanString; includeAgents?: booleanString }) => {
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
		GET: (params: { selector: string; onlyMyDepartments: booleanString }) => {
			items: ILivechatDepartment[];
		};
	};
	'/v1/livechat/department/:departmentId/agents': {
		GET: (params: { sort: string }) => PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>;
		POST: (params: { upsert: string[]; remove: string[] }) => void;
	};
	'/v1/livechat/departments.available-by-unit/:id': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'/v1/livechat/departments.by-unit/': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'/v1/livechat/departments.by-unit/:id': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};

	'/v1/livechat/department.listByIds': {
		GET: (params: { ids: string[]; fields?: Record<string, unknown> }) => {
			departments: ILivechatDepartment[];
		};
	};

	'/v1/livechat/custom-fields': {
		GET: (params: PaginatedRequest<{ text: string }>) => PaginatedResult<{
			customFields: [
				{
					_id: string;
					label: string;
				},
			];
		}>;
	};
	'/v1/livechat/rooms': {
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
	'/v1/livechat/:rid/messages': {
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/livechat/users/agent': {
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

	'/v1/livechat/users/manager/:_id': {
		DELETE: () => { success: boolean };
	};

	'/v1/livechat/users/manager': {
		GET: (params: PaginatedRequest<{ text?: string }>) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: { username: string }) => { success: boolean };
	};

	'/v1/livechat/visitor': {
		POST: (params: { visitor: ILivechatVisitorDTO }) => {
			visitor: ILivechatVisitor;
		};
	};

	'/v1/livechat/visitor/:token': {
		GET: () => { visitor: ILivechatVisitor };
		DELETE: (params: { token: string }) => {
			visitor: { _id: string; ts: string };
		};
	};

	'/v1/livechat/visitor/:token/room': {
		GET: (params: { token: string }) => { rooms: IOmnichannelRoom[] };
	};

	'/v1/livechat/visitor.callStatus': {
		POST: (params: { token: string; callStatus: string; rid: string; callId: string }) => {
			token: string;
			callStatus: string;
		};
	};

	'/v1/livechat/visitor.status': {
		POST: (params: { token: string; status: string }) => {
			token: string;
			status: string;
		};
	};

	'/v1/livechat/queue': {
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
	'/v1/livechat/agents/:uid/departments?enabledDepartmentsOnly=true': {
		GET: () => { departments: ILivechatDepartment[] };
	};

	'/v1/canned-responses': {
		GET: (
			params: PaginatedRequest<{
				scope?: string;
				departmentId?: string;
				text?: string;
			}>,
		) => PaginatedResult<{
			cannedResponses: IOmnichannelCannedResponse[];
		}>;
	};

	'/v1/livechat/webrtc.call': {
		GET: (params: { rid: string }) => void;
	};

	'/v1/livechat/webrtc.call/:callId': {
		PUT: (params: { rid: string; status: 'ended' }) => void;
	};
};
