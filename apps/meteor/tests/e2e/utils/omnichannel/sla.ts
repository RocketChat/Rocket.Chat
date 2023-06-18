import { faker } from '@faker-js/faker';
import { type IOmnichannelServiceLevelAgreements, DEFAULT_SLA_CONFIG } from '@rocket.chat/core-typings';

import type { BaseTest } from '../test';
import { expect } from '../test';

export const generateRandomSLAData = (): Omit<IOmnichannelServiceLevelAgreements, '_updatedAt' | '_id'> => ({
	name: faker.person.firstName(),
	description: faker.lorem.sentence(),
	dueTimeInMinutes: faker.number.int({ min: 10, max: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE }),
});

export const createSLA = async (api: BaseTest['api']): Promise<Omit<IOmnichannelServiceLevelAgreements, '_updated'>> => {
	const response = await api.post('/livechat/sla', generateRandomSLAData());
	expect(response.status()).toBe(200);

	const { sla } = (await response.json()) as { sla: Omit<IOmnichannelServiceLevelAgreements, '_updated'> };
	return sla;
};
