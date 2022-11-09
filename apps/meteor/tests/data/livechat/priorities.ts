import faker from '@faker-js/faker';
import { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { credentials, methodCall, request } from '../api-data';
import { DummyResponse } from './utils';

export const saveSLA = (): Promise<IOmnichannelServiceLevelAgreements> => {
    return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:saveSLA`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveSLA',
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

export const deleteSLA = (id: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:removeSLA`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:removeSLA',
					params: [id],
					id: '101',
					msg: 'method',
				}),
			})
			.end((err: Error, _res: DummyResponse<void,'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
	});
}
