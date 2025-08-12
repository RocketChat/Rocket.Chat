import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { mockAppRoot } from '..';

// TODO: this will live in `mock-providers` package
function createFakeUser(overrides?: Partial<IUser>): IUser {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		createdAt: faker.date.recent(),
		roles: ['user'],
		active: faker.datatype.boolean(),
		type: 'user',
		...overrides,
	};
}

const SAMPLE_STATUS = 'Sample Status';

const user = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
	statusText: 'Sample Status',
	status: UserStatus.ONLINE,
});

describe('useUserPresence', () => {
	it('should return presence from context', () => {
		const { result } = renderHook(() => useUserPresence(user._id), {
			wrapper: mockAppRoot().withUsers([user]).build(),
		});

		expect(result.current?.status).toEqual(UserStatus.ONLINE);
		expect(result.current?.statusText).toEqual(SAMPLE_STATUS);
	});
});
