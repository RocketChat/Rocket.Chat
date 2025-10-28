import { getUserDisplayName } from '@rocket.chat/core-typings';

const fakeUser = {
	name: 'John Doe',
	username: 'john.doe',
};

it('should return username if UI_Use_Real_Name setting is false', () => {
	const result = getUserDisplayName(fakeUser.name, fakeUser.username, false);
	expect(result).toBe(fakeUser.username);
});

it('should return name if UI_Use_Real_Name setting is true', () => {
	const result = getUserDisplayName(fakeUser.name, fakeUser.username, true);
	expect(result).toBe(fakeUser.name);
});
