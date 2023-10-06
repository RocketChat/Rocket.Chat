import { faker } from '@faker-js/faker';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { api, credentials, methodCall, request } from '../api-data';
import type { DummyResponse } from './utils';

export const createTrigger = (name: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:saveTrigger`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveTrigger',
					params: [{ name, description: faker.lorem.sentence(), enabled: true, runOnce: faker.datatype.boolean(), actions: [{ name: 'send-message', params: { msg: faker.lorem.sentence(), name: faker.person.firstName(), sender: faker.helpers.arrayElement(['queue', 'custom']) } }], conditions: [{ name: faker.lorem.word(), value: faker.number.int() }] }],
					id: '101',
					msg: 'method',
				}),
			})
			.end((err: Error, _res: DummyResponse<boolean, 'unwrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(true);
			});
	});
};

export const fetchTriggers = (): Promise<ILivechatTrigger[]> => {
    return new Promise((resolve, reject) => {
        request
        .get(api('livechat/triggers'))
        .set(credentials)
        .end((err: Error, res: DummyResponse<ILivechatTrigger[], 'wrapped'>) => {
            if (err) {
                return reject(err);
            }
            resolve(res.body.triggers);
        });
    });
};
