import { faker } from '@faker-js/faker';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createCustomField } from '../utils/omnichannel/custom-field';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.skip(!IS_EE, 'Omnichannel Contact Review > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Contact Review', () => {
	let poHomeChannel: HomeOmnichannel;

	const customFieldName = faker.string.uuid();
	const visitorToken = faker.string.uuid();
	let conversation: Awaited<ReturnType<typeof createConversation>>;
	let customField: Awaited<ReturnType<typeof createCustomField>>;

	test.beforeAll(async ({ api }) => {
		(
			await Promise.all([
				api.post('/livechat/users/agent', { username: 'user1' }),
				api.post('/livechat/users/manager', { username: 'user1' }),
			])
		).every((res) => expect(res.status()).toBe(200));

		customField = await createCustomField(api, { field: customFieldName });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeOmnichannel(page);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('#main-content').waitFor();
	});

	test.beforeEach(async ({ api }) => {
		conversation = await createConversation(api, { visitorName: visitor.name, agentId: `user1`, visitorToken });
	});

	test.beforeEach(async ({ api }) => {
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

		await conversation.delete();
		await customField.delete();
	});

	test('OC - Contact Review - Update custom field conflicting', async ({ page }) => {
		await poHomeChannel.sidenav.getSidebarItemByName(visitor.name).click();
		await poHomeChannel.content.btnContactInformation.click();

		await poHomeChannel.content.contactReviewModal.btnSeeConflicts.click();

		await poHomeChannel.content.contactReviewModal.getFieldByName(customFieldName).click();
		await poHomeChannel.content.contactReviewModal.findOption('custom-field-value-2').click();
		const responseListener = page.waitForResponse('**/api/v1/omnichannel/contacts.conflicts');
		await poHomeChannel.content.contactReviewModal.btnSave.click();
		const response = await responseListener;
		await expect(response.status()).toBe(200);

		await expect(poHomeChannel.content.contactReviewModal.btnSeeConflicts).not.toBeVisible();
	});
});
