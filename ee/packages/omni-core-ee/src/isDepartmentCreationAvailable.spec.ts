import { License, MockedLicenseBuilder } from '@rocket.chat/license';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { isDepartmentCreationAvailable } from '@rocket.chat/omni-core';

import { isDepartmentCreationAvailablePatch } from './isDepartmentCreationAvailable';

beforeEach(async () => {
	await License.setWorkspaceUrl('http://localhost:3000');

	License.setLicenseLimitCounter('activeUsers', () => 0);
	License.setLicenseLimitCounter('guestUsers', () => 0);
	License.setLicenseLimitCounter('roomsPerGuest', async () => 0);
	License.setLicenseLimitCounter('privateApps', () => 0);
	License.setLicenseLimitCounter('marketplaceApps', () => 0);
	License.setLicenseLimitCounter('monthlyActiveContacts', async () => 0);

	License.setLicenseLimitCounter('activeUsers', () => 1);
});

beforeAll(async () => {
	isDepartmentCreationAvailablePatch();

	registerModel('ILivechatDepartmentModel', { countTotal: () => 1 } as unknown as ILivechatDepartmentModel);
});

it('should skip the check if Livechat Enterprise is enabled', async () => {
	const license = new MockedLicenseBuilder();
	license.withGrantedModules(['livechat-enterprise']);
	await License.setLicense(await license.sign());

	const isAvailable = await isDepartmentCreationAvailable();

	expect(isAvailable).toBe(true);
});

it('should not skip the check if Livechat Enterprise is not enabled', async () => {
	const license = new MockedLicenseBuilder();
	license.withGrantedModules([]);
	await License.setLicense(await license.sign());

	const isAvailable = await isDepartmentCreationAvailable();

	expect(isAvailable).toBe(false);
});
