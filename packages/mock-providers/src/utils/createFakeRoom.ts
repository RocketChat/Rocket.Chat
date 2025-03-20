import { faker } from '@faker-js/faker';
import type { IRoom } from '@rocket.chat/core-typings';

export const createFakeRoom = (overrides?: Partial<IRoom & { retention?: { enabled: boolean } }>): IRoom => ({
	_id: faker.database.mongodbObjectId(),
	_updatedAt: faker.date.recent(),
	t: faker.helpers.arrayElement(['c', 'p', 'd']),
	msgs: faker.number.int({ min: 0 }),
	u: {
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		...overrides?.u,
	},
	usersCount: faker.number.int({ min: 0 }),
	autoTranslateLanguage: faker.helpers.arrayElement(['en', 'es', 'pt', 'ar', 'it', 'ru', 'fr']),
	...overrides,
});
