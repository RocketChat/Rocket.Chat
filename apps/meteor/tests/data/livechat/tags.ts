import faker from '@faker-js/faker';
import { ILivechatTag } from '@rocket.chat/core-typings';
import { credentials, methodCall, request } from '../api-data';
import { DummyResponse } from './utils';

export const saveTags = (): Promise<ILivechatTag> => {
    return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:saveTag`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveTag',
					params: [undefined, { name: faker.name.firstName(), description: faker.lorem.sentence() }, []],
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
