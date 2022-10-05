import faker from '@faker-js/faker';
import { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { api, credentials, request } from '../api-data';
import type { DummyResponse } from './utils';

export const createCannedResponse = (): Promise<Partial<IOmnichannelCannedResponse>> =>
	new Promise((resolve, reject) => {
        const response = {
            shortcut: `${faker.random.word()}-${Date.now()}`,
            scope: 'user',
            tags: [faker.random.word()],
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
