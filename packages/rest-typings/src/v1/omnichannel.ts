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
} from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type booleanString = 'true' | 'false';

export type OmnichannelEndpoints = {
	'livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
		};
	};
	'livechat/visitors.info': {
		GET: (params: { visitorId: string }) => {
			visitor: ILivechatVisitor;
		};
	};
	'livechat/room.onHold': {
		POST: (params: { roomId: IRoom['_id'] }) => void;
	};
	'livechat/room.join': {
		GET: (params: { roomId: IRoom['_id'] }) => { success: boolean };
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

	'livechat/department.listByIds': {
		GET: (params: { ids: string[]; fields?: Record<string, unknown> }) => {
			departments: ILivechatDepartment[];
		};
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
			open: booleanString;
			onhold: booleanString;
			agents: string[];
			departmentId: string;
			roomName: string;
			createdAt: string;
			closedAt: string;
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

	'livechat/users/manager/:_id': {
		DELETE: () => { success: boolean };
	};

	'livechat/users/manager': {
		GET: (params: PaginatedRequest<{ text?: string }>) => PaginatedResult<{
			users: ILivechatAgent[];
		}>;
		POST: (params: { username: string }) => { success: boolean };
	};

	'livechat/visitor': {
		POST: (params: { visitor: ILivechatVisitorDTO }) => {
			visitor: ILivechatVisitor;
		};
	};

	'livechat/visitor/:token': {
		GET: (params: { token: string }) => { visitor: ILivechatVisitor };
		DELETE: (params: { token: string }) => {
			visitor: { _id: string; ts: string };
		};
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
		POST: (params: { token: string; status: string }) => {
			token: string;
			status: string;
		};
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
	'livechat/agents/:uid/departments?enabledDepartmentsOnly=true': {
		GET: () => { departments: ILivechatDepartment[] };
	};

	'canned-responses': {
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

	'livechat/agents/:agentId/departments': {
		GET: (params: { agentId: string; enabledDepartmentsOnly?: string }) => { departments: ILivechatDepartmentAgents[] };
	};

	'livechat/business-hour': {
		GET: (params: { _id: string; type: string }) => {
			businessHour: ILivechatBusinessHour;
		};
	};

	'livechat/analytics/dashboards/conversation-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
			totalizers: {
				title: 'Total_conversations' | 'Open_conversations' | 'Total_messages' | 'On_Hold_conversations' | 'Total_visitors';
				value: number;
			}[];
		};
	};

	'livechat/analytics/dashboards/agents-productivity-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
			totalizers: {
				title: 'Busiest_time' | 'Avg_of_available_service_time' | 'Avg_of_service_time';
				value: string;
			}[];
		};
	};

	'livechat/analytics/dashboards/chats-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
			totalizers: Array<
				| {
						title: 'Avg_of_abandoned_chats' | 'Avg_of_chat_duration_time';
						value: string;
				  }
				| { title: 'Total_abandoned_chats'; value: number }
			>;
		};
	};

	'livechat/analytics/dashboards/productivity-totalizers': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
			totalizers: {
				title: 'Avg_response_time' | 'Avg_first_response_time' | 'Avg_reaction_time' | 'Avg_of_waiting_time';
				value: string;
			}[];
		};
	};

	'livechat/analytics/dashboards/charts/chats': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
			open: number;
			closed: number;
			queued: number;
			onhold: number;
		};
	};

	'livechat/analytics/dashboards/charts/chats-per-agent': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
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
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
			[departmentName: string]: {
				open: number;
				closed: number;
			};
		};
	};

	'livechat/analytics/dashboards/charts/timings': {
		GET: (params: { start: string | Date; end: string | Date; departmentId?: string }) => {
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
		POST: (params: { userId: string; inquiryId: string }) => { inquiry: any };
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
			messages: { username: string; msg: string; ts: Date }[];
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
				timeout: Date;
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

	/* @deprecated */
	'livechat/visitors.autocomplete': {
		// deprecated in version 5.0.0. Please use "livechat/visitors.autocompleteByName" instead
		// selector is a Json stringified object of type => { exceptions?: string[]; conditions?: FilterQuery<ILivechatVisitor>; term: string } }
		GET: (params: { selector: string }) => {
			items: Array<Pick<ILivechatVisitor, '_id' | 'name' | 'username'>>;
		};
	};

	'livechat/visitors.autocompleteByName': {
		GET: (params: { term: string }) => {
			items: Array<Pick<ILivechatVisitor, '_id' | 'name' | 'username'>>;
		};
	};

	'livechat/visitors.search': {
		GET: (params: PaginatedRequest<{ term: string }>) => PaginatedResult<{
			visitors: ILivechatVisitor[];
		}>;
	};
};
