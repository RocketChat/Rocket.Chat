import { mockModel } from '@rocket.chat/models/testing';

import { isDepartmentCreationAvailable } from './isDepartmentCreationAvailable';

it('should be available if there are no existing departments', async () => {
	mockModel('LivechatDepartment', { countTotal: async () => 0 });

	const isAvailable = await isDepartmentCreationAvailable();

	expect(isAvailable).toBe(true);
});

it('should not be available if there are existing departments', async () => {
	mockModel('LivechatDepartment', { countTotal: async () => 1 });

	const isAvailable = await isDepartmentCreationAvailable();

	expect(isAvailable).toBe(false);
});
