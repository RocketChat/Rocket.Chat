import faker from '@faker-js/faker';
import { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { api, credentials, methodCall, request } from '../api-data';
import { DummyResponse } from './utils';

export const saveSLAWithDeprecatedMeteorMethod = (): Promise<IOmnichannelServiceLevelAgreements> => {
    return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:saveSLA`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveSLA',
					params: [undefined, generateRandomSLA()],
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

export const saveSLA = (): Promise<Omit<IOmnichannelServiceLevelAgreements, '_updated'>> => {
    return new Promise((resolve, reject) => {
		request
			.post(api('livechat/sla'))
			.set(credentials)
			.send(
				generateRandomSLA(),
			)
			.end((err: Error, res: DummyResponse<{ sla: Omit<IOmnichannelServiceLevelAgreements, '_updated'> }, 'unwrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.sla);
			});
	});
};

export const deleteSLAWithDeprecatedMeteorMethod = (id: string): Promise<void> => {
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

export const deleteSLA = (id: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		request
			.delete(api(`livechat/sla/${id}`))
			.set(credentials)
			.send()
			.end((err: Error, _res: DummyResponse<void,'not-wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
	});
}

export const generateRandomSLA = (): Omit<IOmnichannelServiceLevelAgreements, '_updatedAt' | '_id'> => {
	return {
		name: faker.name.firstName(),
		description: faker.lorem.sentence(),
		dueTimeInMinutes: faker.datatype.number({ min: 10 }),
	};
}
