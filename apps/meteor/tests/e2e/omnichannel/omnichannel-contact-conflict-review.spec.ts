import { faker } from '@faker-js/faker';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelRoomInfo } from '../page-objects/omnichannel-room-info';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.skip(!IS_EE, 'Omnichannel Contact Review > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Contact Review', () => {
	let poHomeChannel: HomeOmnichannel;
	let poRoomInfo: OmnichannelRoomInfo;

	const customFieldName = 'customField';
	const visitorToken = faker.string.uuid();

	test.beforeAll(async ({ api }) => {
		(
			await Promise.all([
				api.post('/livechat/users/agent', { username: 'user1' }),
				api.post('/livechat/users/manager', { username: 'user1' }),
				api.post('/method.call/livechat:saveCustomField', {
					message: JSON.stringify({
						method: 'livechat:saveCustomField',
						params: [
							null,
							{
								field: customFieldName,
								label: customFieldName,
								visibility: 'visible',
								scope: 'visitor',
								searchable: false,
								regexp: '',
								type: 'input',
								required: false,
								defaultValue: '',
								options: '',
								public: false,
							},
						],
						id: 'id',
						msg: 'method',
					}),
				}),
			])
		).every((res) => expect(res.status()).toBe(200));
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeOmnichannel(page);
		poRoomInfo = new OmnichannelRoomInfo(page);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.main-content').waitFor();
	});

	test.beforeEach(async ({ api }) => {
		await createConversation(api, { visitorName: visitor.name, agentId: `user1`, visitorToken });

		const resCustomFieldA = await api.post('/livechat/custom.field', {
			token: visitorToken,
			key: customFieldName,
			value: 'custom-field-value',
			overwrite: true,
		});
		expect(resCustomFieldA.status()).toBe(200);

		const resCustomFieldB = await api.post('/livechat/custom.field', {
			token: visitorToken,
			key: customFieldName,
			value: 'custom-field-value-2',
			overwrite: false,
		});
		expect(resCustomFieldB.status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		(await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/manager/user1')])).every((res) =>
			expect(res.status()).toBe(200),
		);
	});

	test('OC - Contact Review - Update custom field conflicting', async ({ page }) => {
		await test.step('expect to resolve custom field conflict', async () => {
			await poHomeChannel.sidenav.getSidebarItemByName(visitor.name).click();
			await poHomeChannel.content.btnContactInformation.click();

			await page.getByRole('button', { name: 'See conflicts' }).click();

			await page.getByLabel(customFieldName).click();
			await page.getByRole('option', { name: 'custom-field-value-2' }).click();
			await page.getByRole('button', { name: 'Save' }).click();

			const response = await page.waitForResponse('**/api/v1/omnichannel/contacts.update');
			expect(response.status()).toBe(200);
		});
	});
});
