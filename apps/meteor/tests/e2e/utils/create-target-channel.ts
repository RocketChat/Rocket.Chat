import faker from '@faker-js/faker';

import type { BaseTest } from './test';

/**
 * createTargetChannel:
 *  - Usefull to create a target channel for message related tests
 */
export async function createTargetChannel(api: BaseTest['api']): Promise<string> {
	const name = faker.datatype.uuid();

	await api.post('/channels.create', { name });

	return name;
}
