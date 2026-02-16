import { faker } from '@faker-js/faker';

import { createFakeVisitor } from '../../mocks/data';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createCustomField } from '../utils/omnichannel/custom-field';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe('OC - Custom fields usage, scope : room and visitor', () => {
	let poHomeChannel: HomeOmnichannel;

	const roomCustomFieldLabel = `room_cf_${faker.string.alpha(8)}`;
	const roomCustomFieldName = roomCustomFieldLabel;
	const roomCustomFieldValue = faker.lorem.words(3);

	const visitorCustomFieldLabel = `visitor_cf_${faker.string.alpha(8)}`;
	const visitorCustomFieldName = visitorCustomFieldLabel;
	const visitorCustomFieldValue = faker.lorem.words(3);
	const visitorToken = faker.string.uuid();

	let conversation: Awaited<ReturnType<typeof createConversation>>;
	let roomCustomField: Awaited<ReturnType<typeof createCustomField>>;
	let visitorCustomField: Awaited<ReturnType<typeof createCustomField>>;

	test.beforeAll('Set up agent, manager and custom fields', async ({ api }) => {
		const responses = await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
		]);
		responses.forEach((res) => expect(res.status()).toBe(200));

		roomCustomField = await createCustomField(api, {
			field: roomCustomFieldLabel,
			label: roomCustomFieldName,
			scope: 'room',
		});

		visitorCustomField = await createCustomField(api, {
			field: visitorCustomFieldName,
			label: visitorCustomFieldLabel,
			scope: 'visitor',
		});

		conversation = await createConversation(api, {
			visitorName: visitor.name,
			agentId: 'user1',
			visitorToken,
		});

		const res = await api.post('/livechat/custom.field', {
			token: visitorToken,
			key: visitorCustomField.customField._id,
			value: visitorCustomFieldValue,
			overwrite: true,
		});
		expect(res.status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeOmnichannel(page);
		await page.goto('/');
		await page.locator('#main-content').waitFor();
	});

	test.afterAll('Remove agent, manager and custom fields', async ({ api }) => {
		const responses = await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/manager/user1')]);
		responses.forEach((res) => expect(res.status()).toBe(200));

		await roomCustomField.delete();
		await visitorCustomField.delete();
		await conversation.delete();
	});

	test('Should be allowed to set room custom field for a conversation', async () => {
		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens edit room', async () => {
			await poHomeChannel.roomInfo.btnEditRoomInfo.click();
			await expect(poHomeChannel.roomInfo.dialogEditRoom).toBeVisible();
		});

		await test.step('Agent fills room custom field and saves', async () => {
			await poHomeChannel.roomInfo.getRoomCustomFieldInput(roomCustomFieldLabel).fill(roomCustomFieldValue);
			await poHomeChannel.roomInfo.btnSaveEditRoom.click();
		});

		await test.step('assert custom field is updated successfully', async () => {
			await poHomeChannel.roomInfo.btnEditRoomInfo.click();
			await expect(poHomeChannel.roomInfo.getRoomCustomFieldInput(roomCustomFieldLabel)).toHaveValue(roomCustomFieldValue);
		});
	});

	test('Should be allowed to update existing room custom field', async () => {
		const updatedValue = faker.lorem.words(2);

		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens edit room and updates custom field', async () => {
			await poHomeChannel.roomInfo.btnEditRoomInfo.click();
			await expect(poHomeChannel.roomInfo.dialogEditRoom).toBeVisible();
			await poHomeChannel.roomInfo.getRoomCustomFieldInput(roomCustomFieldLabel).fill(updatedValue);
			await poHomeChannel.roomInfo.btnSaveEditRoom.click();
		});

		await test.step('Room Information displays the updated custom field value', async () => {
			await poHomeChannel.roomInfo.btnEditRoomInfo.click();
			await expect(poHomeChannel.roomInfo.getRoomCustomFieldInput(roomCustomFieldLabel)).toHaveValue(updatedValue);
		});
	});

	test('Should verify that the visitor custom field is set', async () => {
		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens Contact Information', async () => {
			await poHomeChannel.roomToolbar.openContactInfo();
			await expect(poHomeChannel.contacts.contactInfo.dialogContactInfo).toBeVisible();
		});

		await test.step('Assert custom field is set successfully', async () => {
			await expect(poHomeChannel.contacts.contactInfo.dialogContactInfo).toContainText(visitorCustomFieldValue);
		});
	});

	test('Should be allowed to update existing visitor custom field', async () => {
		const updatedVisitorCustomFieldValue = faker.lorem.words(2);

		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens Contact Information', async () => {
			await poHomeChannel.roomToolbar.openContactInfo();
			await expect(poHomeChannel.contacts.contactInfo.dialogContactInfo).toBeVisible();
		});

		await test.step('Agent clicks edit and updates visitor custom field', async () => {
			await poHomeChannel.contacts.contactInfo.btnEdit.click();
			await poHomeChannel.contacts.contactInfo.getVisitorCustomFieldInput(visitorCustomFieldLabel).fill(updatedVisitorCustomFieldValue);
			await poHomeChannel.contacts.contactInfo.btnSave.click();
		});

		await test.step('Assert custom field is updated successfully', async () => {
			await expect(poHomeChannel.contacts.contactInfo.dialogContactInfo).toContainText(updatedVisitorCustomFieldValue);
		});
	});
});
