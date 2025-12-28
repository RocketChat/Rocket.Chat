import { faker } from '@faker-js/faker';
import type { ILivechatTag, FindTagsResult } from '@rocket.chat/core-typings';

import { credentials, request, api } from '../api-data';
import type { DummyResponse } from './utils';

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

export const removeAllTags = async (): Promise<boolean> => {
	const tagsList = await listTags();
	await Promise.all(tagsList.tags.map((tag) => removeTag(tag._id)));

	const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(200);

	return response.body.tags.length === 0;
};

export const removeTag = (id: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		void request
			.post(api('livechat/tags.delete'))
			.set(credentials)
			.send({ id })
			.end((err: Error, res: DummyResponse<string, 'wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.success).result);
			});
	});
};
