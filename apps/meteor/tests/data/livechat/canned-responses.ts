import { faker } from '@faker-js/faker';
import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';

import { api, credentials, request } from '../api-data';
import type { DummyResponse } from './utils';

export const createCannedResponse = (): Promise<Partial<IOmnichannelCannedResponse>> =>
	new Promise((resolve, reject) => {
		const response = {
			shortcut: `${faker.lorem.word()}-${Date.now()}`,
			scope: 'user',
			tags: [faker.string.uuid()],
			text: faker.lorem.sentence(),
		};
		return request
			.post(api(`canned-responses`))
			.set(credentials)
			.send(response)
			.end((_err: Error, _res: DummyResponse<boolean>) => {
				if (_err) {
					return reject(_err);
				}
				resolve(response);
			});
	});
