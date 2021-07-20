import { ILivechatDepartment } from '../../../../../../definition/ILivechatDepartment';
import { IOmnichannelCannedResponse } from '../../../../../../definition/IOmnichannelCannedResponse';
import { IUser } from '../../../../../../definition/IUser';

export type CannedResponsesEndpoint = {
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
	POST: (params: {
		_id?: IOmnichannelCannedResponse['_id'];
		shortcut: string;
		text: string;
		scope: string;
		tags?: any;
		departmentId?: ILivechatDepartment['_id'];
	}) => {
		success: true;
		statusCode: 200;
	};
	DELETE: (params: { _id: IOmnichannelCannedResponse['_id'] }) => {
		success: true;
		statusCode: 200;
	};
};
