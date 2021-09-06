import { ILivechatDepartment } from '../../../../../definition/ILivechatDepartment';
import { ILivechatMonitor } from '../../../../../definition/ILivechatMonitor';
import { ILivechatTag } from '../../../../../definition/ILivechatTag';
import { IOmnichannelCannedResponse } from '../../../../../definition/IOmnichannelCannedResponse';
import { IOmnichannelRoom, IRoom } from '../../../../../definition/IRoom';
import { ISetting } from '../../../../../definition/ISetting';
import { IUser } from '../../../../../definition/IUser';

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
		POST: (payload: { roomId: IRoom['_id'] }) => void;
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
		path: `livechat/department/${string}`;
		GET: () => {
			department: ILivechatDepartment;
		};
	};
	'livechat/departments.by-unit/': {
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
	'canned-responses': {
		GET: (params: {
			shortcut?: string;
			text?: string;
			scope?: string;
			createdBy?: IUser['username'];
			tags?: any;
			departmentId?: ILivechatDepartment['_id'];
			offset?: number;
			count?: number;
		}) => {
			cannedResponses: IOmnichannelCannedResponse[];
			count?: number;
			offset?: number;
			total: number;
		};
		POST: (payload: {
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
		path: `canned-responses/${string}`;
		GET: () => {
			cannedResponse: IOmnichannelCannedResponse;
		};
	};
};
