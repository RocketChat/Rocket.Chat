import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { isDepartmentCreationAvailable } from './isDepartmentCreationAvailable';

it('should be available if there are no existing departments', async () => {
	registerModel('ILivechatDepartmentModel', { countTotal: () => 0 } as unknown as ILivechatDepartmentModel);

	const isAvailable = await isDepartmentCreationAvailable();

	expect(isAvailable).toBe(true);
});

it('should not be available if there are existing departments', async () => {
	registerModel('ILivechatDepartmentModel', { countTotal: () => 1 } as unknown as ILivechatDepartmentModel);

	const isAvailable = await isDepartmentCreationAvailable();

	expect(isAvailable).toBe(false);
});
