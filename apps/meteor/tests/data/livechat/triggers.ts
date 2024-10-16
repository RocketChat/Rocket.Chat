import { faker } from '@faker-js/faker';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';

import { api, credentials, request } from '../api-data';
import type { DummyResponse } from './utils';

export const createTrigger = (name: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		void request
			.post(api('livechat/triggers'))
			.set(credentials)
			.send({
				name,
				description: faker.lorem.sentence(),
				enabled: true,
				runOnce: faker.datatype.boolean(),
				actions: [
					{
						name: 'send-message',
						params: {
							msg: faker.lorem.sentence(),
							name: faker.person.firstName(),
							sender: faker.helpers.arrayElement(['queue', 'custom']),
						},
					},
				],
				conditions: [
					{
						name: faker.helpers.arrayElement(['time-on-site', 'page-url', 'chat-opened-by-visitor', 'after-guest-registration']),
						value: faker.string.alpha(),
					},
				],
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
		void request
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
