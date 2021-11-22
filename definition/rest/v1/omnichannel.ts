import { ILivechatDepartment } from '../../ILivechatDepartment';
import { ILivechatMonitor } from '../../ILivechatMonitor';
import { ILivechatTag } from '../../ILivechatTag';
import { IOmnichannelRoom, IRoom } from '../../IRoom';
import { ISetting } from '../../ISetting';

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
		GET: (params: { text: string; offset: number; count: number }) => {
			monitors: ILivechatMonitor[];
			total: number;
		};
	};
	'livechat/tags.list': {
		GET: (params: { text: string; offset: number; count: number }) => {
			tags: ILivechatTag[];
			total: number;
		};
	};
	'livechat/department': {
		GET: (params: {
			text: string;
			offset?: number;
			count?: number;
			sort?: string;
			onlyMyDepartments?: boolean;
		}) => {
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
	'livechat/users/agent': {
		GET: (params: { text?: string; offset?: number; count?: number; sort?: string }) => {
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
};
