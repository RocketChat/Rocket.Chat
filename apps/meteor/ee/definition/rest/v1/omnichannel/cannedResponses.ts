import type { ILivechatDepartment, IOmnichannelCannedResponse, IUser } from '@rocket.chat/core-typings';
import type { PaginatedResult, PaginatedRequest } from '@rocket.chat/rest-typings';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/canned-responses': {
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
		'/v1/canned-responses/:_id': {
			GET: () => {
				cannedResponse: IOmnichannelCannedResponse;
			};
		};
	}
}
