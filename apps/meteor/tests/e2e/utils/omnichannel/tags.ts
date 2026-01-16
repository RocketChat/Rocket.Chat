import { faker } from '@faker-js/faker';
import type { ILivechatTag } from '@rocket.chat/core-typings';

import type { BaseTest } from '../test';

type CreateTagParams = {
	id?: string | null;
	name?: string;
	description?: string;
	departments?: string[];
};

const removeTag = async (api: BaseTest['api'], id: string) => api.post('/livechat/tags.delete', { id });

export const createTag = async (api: BaseTest['api'], { id = null, name, description, departments = [] }: CreateTagParams = {}) => {
	const response = await api.post('/livechat/tags.save', {
		_id: id,
		tagData: {
			name: name ?? faker.string.alpha({ length: 8 }),
			description: description ?? faker.string.alpha({ length: 16 }),
		},
		...(departments.length > 0 && { tagDepartments: departments }),
	});

	if (response.status() !== 200) {
		throw new Error(`Failed to create tag [http status: ${response.status()}]`);
	}

	const data: ILivechatTag = await response.json();

	return {
		response,
		data,
		delete: async () => removeTag(api, data._id),
	};
};
