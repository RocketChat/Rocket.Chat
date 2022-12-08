import faker from '@faker-js/faker';
import { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import { api, credentials, request } from '../api-data';
import { DummyResponse } from './utils';

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
