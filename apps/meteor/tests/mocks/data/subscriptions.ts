import { faker } from '@faker-js/faker';

export function mockSubscription() {
	const data: Record<string, any> = {
		_id: faker.string.uuid(),
		rid: faker.string.uuid(),
		name: faker.person.firstName(),
		t: 'd',
		alert: true,
		E2EKey: faker.datatype.boolean() ? faker.string.uuid() : undefined,
		E2ESuggestedKey: faker.datatype.boolean() ? faker.string.uuid() : undefined,
		oldRoomKeys: faker.datatype.boolean() ? generateOldKeys() : undefined,
		u: {
			_id: faker.person.firstName(),
		},
	};

	return data;
}

function generateOldKeys() {
	const amount = faker.number.int({ min: 1, max: 10 });
	const oldRoomKeys = [];
	for (let i = 0; i < amount; i++) {
		oldRoomKeys.push({
			E2EKey: faker.string.uuid(),
			ts: new Date(),
			e2eKeyId: faker.string.uuid().slice(12),
		});
	}
	return oldRoomKeys;
}

export function generateMultipleSubs(amount: number) {
	const subs = [];
	for (let i = 0; i < amount; i++) {
		subs.push(mockSubscription());
	}
	return subs;
}
