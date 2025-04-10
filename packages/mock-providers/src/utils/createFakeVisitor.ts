import { faker } from '@faker-js/faker';

const guestNames = faker.helpers.uniqueArray(faker.person.firstName, 1000);

function pullNextVisitorName() {
	const guestName = guestNames.pop();

	if (!guestName) {
		throw new Error('exhausted guest names');
	}

	return guestName;
}

export function createFakeVisitor() {
	return {
		name: pullNextVisitorName(),
		email: faker.internet.email(),
	} as const;
}
