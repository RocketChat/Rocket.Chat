import type { ILivechatTag } from '@rocket.chat/core-typings';

import type { BaseTest } from '../test';

type CreateTagParams = {
	id?: string | null;
	name?: string;
	description?: string;
	departments?: { departmentId: string }[];
};

const removeTag = async (api: BaseTest['api'], id: string) => api.post('/livechat/tags.delete', { id });

export const createTag = async (api: BaseTest['api'], { id = null, name, description = '', departments = [] }: CreateTagParams = {}) => {
	const response = await api.post('/livechat/tags.save', {
		id,
		tagData: {
			name,
			description
		},
		tagDepartments: departments.map((department: { departmentId: string }) => department.departmentId),
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
