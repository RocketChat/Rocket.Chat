import { ILivechatDepartment } from '../../ILivechatDepartment';
import { ILivechatMonitor } from '../../ILivechatMonitor';
import { ILivechatTag } from '../../ILivechatTag';
import { ILivechatVisitor, ILivechatVisitorDTO } from '../../ILivechatVisitor';
import { IMessage } from '../../IMessage';
import { IOmnichannelRoom, IRoom } from '../../IRoom';
import { ISetting } from '../../ISetting';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type OmnichannelEndpoints = {
	'livechat/appearance': {
		GET: () => {
			appearance: ISetting[];
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
				onlyMyDepartments?: boolean;
			}>,
		) => PaginatedResult<{
			departments: ILivechatDepartment[];
		}>;
	};
	'livechat/department/:_id': {
		GET: () => {
			department: ILivechatDepartment;
		};
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
};
