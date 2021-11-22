import { ILivechatDepartment } from '../../ILivechatDepartment';
import { ILivechatMonitor } from '../../ILivechatMonitor';
import { ILivechatTag } from '../../ILivechatTag';
import { IMessage } from '../../IMessage';
import { IOmnichannelCannedResponse } from '../../IOmnichannelCannedResponse';
import { IOmnichannelRoom, IRoom } from '../../IRoom';
import { ISetting } from '../../ISetting';
import { IUser } from '../../IUser';
import { PaginatedRequest } from '../helpers/PaginatedRequest';

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
		GET: (params: PaginatedRequest<{ text: string }>) => {
			monitors: ILivechatMonitor[];
			total: number;
		};
	};
	'livechat/tags.list': {
		GET: (params: PaginatedRequest<{ text: string }, 'name'>) => {
			tags: ILivechatTag[];
			total: number;
		};
	};
	'livechat/department': {
		GET: (params: PaginatedRequest<{
			text: string;
			onlyMyDepartments?: boolean;
		}>) => {
			departments: ILivechatDepartment[];
			total: number;
		};
	};
	'livechat/department/:_id': {
		GET: () => {
			department: ILivechatDepartment;
		};
	};
	'livechat/departments.by-unit/:id': {
		GET: (params: { text: string; offset: number; count: number }) => {
			departments: ILivechatDepartment[];
			total: number;
		};
	};
	'livechat/departments.available-by-unit/:id': {
		GET: (params: { text: string; offset: number; count: number }) => {
			departments: ILivechatDepartment[];
			total: number;
		};
	};
	'livechat/custom-fields': {
		GET: () => {
			customFields: [
				{
					_id: string;
					label: string;
				},
			];
		};
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
		}) => {
			rooms: IOmnichannelRoom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'livechat/:rid/messages': {
		GET: (params: { query: string ; sort?: string } & PaginatedRequest) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'livechat/users/agent': {
		GET: (params: { text?: string; sort?: string } & PaginatedRequest) => {
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
			count: number;
			offset: number;
			total: number;
		};
	};
	'canned-responses': {
		GET: (params: {
			shortcut?: string;
			text?: string;
			scope?: string;
			createdBy?: IUser['username'];
			tags?: any;
			departmentId?: ILivechatDepartment['_id'];
		} & PaginatedRequest) => {
			cannedResponses: IOmnichannelCannedResponse[];
			count?: number;
			offset?: number;
			total: number;
		};
		POST: (params: {
			_id?: IOmnichannelCannedResponse['_id'];
			shortcut: string;
			text: string;
			scope: string;
			tags?: any;
			departmentId?: ILivechatDepartment['_id'];
		}) => void;
		DELETE: (params: { _id: IOmnichannelCannedResponse['_id'] }) => void;
	};
	'canned-responses/:_id': {
		GET: () => {
			cannedResponse: IOmnichannelCannedResponse;
		};
	};
};
