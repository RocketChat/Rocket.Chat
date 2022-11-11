import faker from '@faker-js/faker';
import { ILivechatPriority } from '@rocket.chat/core-typings';
import { credentials, methodCall, request } from '../api-data';
import { DummyResponse } from './utils';

export const savePriority = (): Promise<ILivechatPriority> => {
    return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:savePriority`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:savePriority',
					params: [undefined, { name: faker.name.firstName(), description: faker.lorem.sentence(), dueTimeInMinutes: `${faker.datatype.number({ min: 10 })}` }],
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
