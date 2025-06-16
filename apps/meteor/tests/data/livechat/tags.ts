import { faker } from '@faker-js/faker';
import type { ILivechatTag } from '@rocket.chat/core-typings';

import { credentials, methodCall, request } from '../api-data';
import type { DummyResponse } from './utils';

export const saveTags = (departments: string[] = []): Promise<ILivechatTag> => {
	return new Promise((resolve, reject) => {
		void request
			.post(methodCall(`livechat:saveTag`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveTag',
					params: [undefined, { name: faker.string.uuid(), description: faker.lorem.sentence() }, departments],
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
