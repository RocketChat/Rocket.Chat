import type { ILivechatDepartment, IOmnichannelCannedResponse, IUser } from '@rocket.chat/core-typings';
import type { PaginatedResult, PaginatedRequest } from '@rocket.chat/rest-typings';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Endpoints {
		'canned-responses': {
			GET: (
				params: PaginatedRequest<{
					shortcut?: string;
					text?: string;
					scope?: string;
					createdBy?: IUser['username'];
					tags?: any;
					departmentId?: ILivechatDepartment['_id'];
				}>,
			) => PaginatedResult<{
				cannedResponses: IOmnichannelCannedResponse[];
			}>;
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
	}
}
