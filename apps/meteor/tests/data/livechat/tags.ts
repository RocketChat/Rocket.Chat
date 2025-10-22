import { faker } from '@faker-js/faker';
import type { ILivechatTag } from '@rocket.chat/core-typings';

import { credentials, methodCall, request, api } from '../api-data';
import type { DummyResponse } from './utils';

export const saveTags = (departments: string[] = []): Promise<ILivechatTag> => {
	return new Promise((resolve, reject) => {
		void request
			.post(api('livechat/tags.save'))
			.set(credentials)
			.send({
				tagData: {
					name: faker.string.uuid(),
					description: faker.lorem.sentence(),
				},
				tagDepartments: departments,
			})
			.end((err: Error, res: DummyResponse<ILivechatTag, 'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
	});
};

export const removeTag = (id: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		void request
			.post(methodCall(`livechat:removeTag`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:removeTag',
					params: [id],
					id: '101',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<string, 'wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.message).result);
			});
	});
};
