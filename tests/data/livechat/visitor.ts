import { Response } from 'supertest';

import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { api, request } from '../api-data';

export const createVisitor = (visitor: ILivechatVisitor): Promise<Response> => {
	return request.post(api('livechat/visitor')).send({
		visitor,
	});
};
