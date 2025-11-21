import { faker } from '@faker-js/faker';
import type { ILivechatTag } from '@rocket.chat/core-typings';

import { credentials, request, api } from '../api-data';

export const saveTags = async (departments: string[] = []): Promise<ILivechatTag> => {
	const { body } = await request
		.post(api('livechat/tags.save'))
		.set(credentials)
		.send({
			tagData: {
				name: faker.string.uuid(),
				description: faker.lorem.sentence(),
			},
			tagDepartments: departments,
		});

	return body;
};

export const removeTag = async (id: string): Promise<boolean> => {
	const res = await request.post(api('livechat/tags.delete')).set(credentials).send({ id });

	return res.status === 200;
};
