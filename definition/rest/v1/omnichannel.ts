import { ILivechatInquiryRecord } from '../../IInquiry';
import { ILivechatAgent } from '../../ILivechatAgent';
import { ILivechatBusinessHour } from '../../ILivechatBusinessHour';
import { ILivechatDepartment } from '../../ILivechatDepartment';
import { ILivechatDepartmentAgents } from '../../ILivechatDepartmentAgents';
import { ILivechatMonitor } from '../../ILivechatMonitor';
import { ILivechatTag } from '../../ILivechatTag';
import { ILivechatTrigger } from '../../ILivechatTrigger';
import { ILivechatVisitor, ILivechatVisitorDTO } from '../../ILivechatVisitor';
import { IMessage } from '../../IMessage';
import { IOmnichannelRoom, IRoom } from '../../IRoom';
import { ISetting } from '../../ISetting';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

type booleanString = 'true' | 'false';

export type OmnichannelEndpoints = {
	'livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
		};
	};
	'livechat/business-hour': {
		GET: (params: { _id: string; type: string }) => {
			businessHour: ILivechatBusinessHour;
		};
	};
	'livechat/visitors.info': {
		GET: (params: { visitorId: string }) => {
			visitor: {
				visitorEmails: Array<{
					address: string;
				}>;
			};
		};
	};
	'livechat/room.onHold': {
		POST: (params: { roomId: IRoom['_id'] }) => void;
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
		GET: (params: { onlyMyDepartments?: booleanString; includeAgents?: booleanString }) => {
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
		GET: (params: { selector: string; onlyMyDepartments: booleanString }) => {
			items: ILivechatDepartment[];
		};
	};
	'livechat/department/:departmentId/agents': {
		GET: (params: { sort: string }) => PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>;
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
			agents: string[];
			departmentId: string;
			open: string;
			roomName: string;
			onhold: string;
			createdAt: Date;
			closedAt: Date;
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
		GET: (params: { token: string }) => { visitor: ILivechatVisitor };
		DELETE: (params: { token: string }) => { visitor: { _id: string; ts: string } };
	};

	'livechat/visitor/:token/room': {
		GET: (params: { token: string }) => { rooms: IOmnichannelRoom[] };
	};

	'livechat/visitor.callStatus': {
		POST: (params: { token: string; callStatus: string; rid: string; callId: string }) => {
			token: string;
			callStatus: string;
		};
	};

	'livechat/visitor.status': {
		POST: (params: { token: string; status: string }) => { token: string; status: string };
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

	'livechat/agents/:agentId/departments': {
		GET: (params: { agentId: string; enabledDepartmentsOnly?: string }) => { departments: ILivechatDepartmentAgents[] };
	};

	'livechat/analytics/dashboards/conversation-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => { totalizers: any[] };
	};

	'livechat/analytics/dashboards/agents-productivity-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => { totalizers: any[] };
	};

	'livechat/analytics/dashboards/chats-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => { totalizers: any[] };
	};

	'livechat/analytics/dashboards/productivity-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => { totalizers: any[] };
	};

	'livechat/analytics/dashboards/charts/chats': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => {};
	};

	'livechat/analytics/dashboards/charts/chats-per-agent': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => {};
	};

	'livechat/analytics/dashboards/charts/agents-status': {
		GET: (params: { departmentId: undefined }) => {};
	};

	'livechat/analytics/dashboards/charts/chats-per-department': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => {};
	};

	'livechat/analytics/dashboards/charts/timings': {
		GET: (params: { start: string | Date; end: string | Date; departmentId: undefined }) => {};
	};

	'livechat/inquiries.list': {
		GET: (params: { department: string }) => {};
	};

	'livechat/inquiries.take': {
		POST: (params: { userId: string; inquiryId: string }) => { inquiry: any };
	};

	'livechat/inquiries.queued': {
		GET: (params: { department: number }) => { inquiries: ILivechatInquiryRecord[] };
	};

	'livechat/inquiries.getOne': {
		GET: (params: { roomId: string }) => { inquiry: ILivechatInquiryRecord | null };
	};

	'livechat/integrations.settings': {
		GET: () => { settings: ISetting[] };
	};

	'livechat/messages.external/:roomId': {
		GET: (params: { roomId: string }) => {};
	};

	'livechat/office-hours': {
		GET: (params: {}) => {};
	};
	'livechat/sms-incoming/:service': {
		POST: (params: { service: any; sms: any; department: string }) => {};
	};

	'livechat/triggers': {
		GET: (params: { _id: string }) => { triggers: ILivechatTrigger[] };
	};
};
