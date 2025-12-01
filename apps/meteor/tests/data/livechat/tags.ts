import { faker } from '@faker-js/faker';
import type { ILivechatTag, FindTagsResult } from '@rocket.chat/core-typings';

import { credentials, request, api } from '../api-data';

export const listTags = async (): Promise<FindTagsResult> => {
	const { body } = await request.get(api('livechat/tags')).set(credentials).query({ viewAll: 'true' });

	return body;
};

export const saveTags = async (departments: string[] = []): Promise<ILivechatTag> => {
	const { body } = await request
		.post(api('livechat/tags.save'))
		.set(credentials)
		.send({
			tagData: {
				name: faker.string.uuid(),
				description: faker.lorem.sentence(),
			},
			...(departments.length > 0 && { tagDepartments: departments }),
		});

	return body;
};

export const removeTag = async (id: string): Promise<boolean> => {
	const res = await request.post(api('livechat/tags.delete')).set(credentials).send({ id });

	return res.status === 200;
};

export const removeAllTags = async (): Promise<boolean> => {
	const tagsList = await listTags();
	await Promise.all(tagsList.tags.map((tag) => removeTag(tag._id)));

	const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(200);

	return response.body.tags.length === 0;
};
