import { ILivechatTag } from '@rocket.chat/core-typings';

import { BaseTest } from '../test';
import { parseMeteorResponse } from './utils';

type CreateTagParams = {
	id?: string | null;
	name?: string;
	description?: string;
	departments?: { departmentId: string }[];
};

export const removeTag = async (api: BaseTest['api'], id: string) =>
	api.post('/method.call/omnichannel:removeTag', {
		message: JSON.stringify({ msg: 'method', id: '35', method: 'livechat:removeTag', params: [id] }),
	});

export const createTag = async (
	api: BaseTest['api'],
	{ id = null, name, description = '', departments = [] }: CreateTagParams = {},
	) => {
		const response = await api.post('/method.call/livechat:saveTag', {
			message: JSON.stringify({
				msg: 'method',
				id: '33',
				method: 'livechat:saveTag',
				params: [id, { name, description }, departments]})
		});

		const tag = await parseMeteorResponse<ILivechatTag>(response);

		return {
			response,
			data: tag,
			delete: async () => removeTag(api, tag?._id),
		};
};
