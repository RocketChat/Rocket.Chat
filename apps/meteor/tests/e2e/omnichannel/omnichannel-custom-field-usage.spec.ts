import { faker } from '@faker-js/faker';

import { createFakeVisitor } from '../../mocks/data';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createCustomField, setVisitorCustomFieldValue } from '../utils/omnichannel/custom-field';
import { createManager } from '../utils/omnichannel/managers';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Custom fields usage, scope : room and visitor', () => {
	let poHomeChannel: HomeOmnichannel;

	const roomCustomFieldLabel = `room_cf_${faker.string.alpha(8)}`;
	const roomCustomFieldName = roomCustomFieldLabel;
	const roomCustomFieldValue = faker.lorem.words(3);

	const visitorCustomFieldLabel = `visitor_cf_${faker.string.alpha(8)}`;
	const visitorCustomFieldName = visitorCustomFieldLabel;
	const visitorCustomFieldValue = faker.lorem.words(3);
	const visitorToken = faker.string.uuid();

	let agent: Awaited<ReturnType<typeof createAgent>>;
	let manager: Awaited<ReturnType<typeof createManager>>;
	let conversation: Awaited<ReturnType<typeof createConversation>>;
	let roomCustomField: Awaited<ReturnType<typeof createCustomField>>;
	let visitorCustomField: Awaited<ReturnType<typeof createCustomField>>;

	test.beforeAll('Set up agent, manager and custom fields', async ({ api }) => {
		[agent, manager] = await Promise.all([createAgent(api, 'user1'), createManager(api, 'user1')]);

		[roomCustomField, visitorCustomField, conversation] = await Promise.all([
			createCustomField(api, {
				field: roomCustomFieldLabel,
				label: roomCustomFieldName,
				scope: 'room',
			}),
			createCustomField(api, {
				field: visitorCustomFieldLabel,
				label: visitorCustomFieldName,
				scope: 'visitor',
			}),
			createConversation(api, {
				visitorName: visitor.name,
				agentId: 'user1',
				visitorToken,
			}),
		]);

		await setVisitorCustomFieldValue(api, {
			token: visitorToken,
			customFieldId: visitorCustomField.customField._id,
			value: visitorCustomFieldValue,
		});
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeOmnichannel(page);
		await page.goto('/');
		await poHomeChannel.waitForHome();
	});

	test.afterAll('Remove agent, manager, custom fields and conversation', async () => {
		await Promise.all([agent.delete(), manager.delete(), roomCustomField.delete(), visitorCustomField.delete(), conversation.delete()]);
	});

	test('Should be allowed to set room custom field for a conversation', async () => {
		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens edit room', async () => {
			await poHomeChannel.roomInfo.waitForDisplay();
			await poHomeChannel.roomInfo.btnEdit.click();
			await poHomeChannel.editRoomInfo.waitForDisplay();
		});

		await test.step('Agent fills room custom field and saves', async () => {
			await poHomeChannel.editRoomInfo.getRoomCustomField(roomCustomFieldLabel).fill(roomCustomFieldValue);
			await poHomeChannel.editRoomInfo.btnSave.click();
		});

		await test.step('Custom field should be updated successfully', async () => {
			await poHomeChannel.roomInfo.btnEdit.click();
			await poHomeChannel.editRoomInfo.waitForDisplay();
			await expect(poHomeChannel.editRoomInfo.getRoomCustomField(roomCustomFieldLabel)).toHaveValue(roomCustomFieldValue);
		});
	});

	test('Should be allowed to update existing room custom field', async () => {
		const updatedValue = faker.lorem.words(2);

		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens edit room and updates custom field', async () => {
			await poHomeChannel.roomInfo.waitForDisplay();
			await poHomeChannel.roomInfo.btnEdit.click();
			await poHomeChannel.editRoomInfo.waitForDisplay();
			await poHomeChannel.editRoomInfo.getRoomCustomField(roomCustomFieldLabel).fill(updatedValue);
			await poHomeChannel.editRoomInfo.btnSave.click();
		});

		await test.step('Room Information displays the updated custom field value', async () => {
			await poHomeChannel.roomInfo.btnEdit.click();
			await poHomeChannel.editRoomInfo.waitForDisplay();
			await expect(poHomeChannel.editRoomInfo.getRoomCustomField(roomCustomFieldLabel)).toHaveValue(updatedValue);
		});
	});

	test('Should verify that the visitor custom field is set', async () => {
		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens Contact Information', async () => {
			await poHomeChannel.roomToolbar.openContactInfo();
			await poHomeChannel.contacts.contactInfo.waitForDisplay();
		});

		await test.step('Assert custom field is set successfully', async () => {
			await expect(poHomeChannel.contacts.contactInfo.getInfoByValue(visitorCustomFieldValue)).toBeVisible();
		});
	});

	test('Should be allowed to update existing visitor custom field', async () => {
		const updatedVisitorCustomFieldValue = faker.lorem.words(2);

		await test.step('Agent opens the conversation', async () => {
			await poHomeChannel.sidebar.getSidebarItemByName(visitor.name).click();
		});

		await test.step('Agent opens Contact Information', async () => {
			await poHomeChannel.roomToolbar.openContactInfo();
			await poHomeChannel.contacts.contactInfo.waitForDisplay();
		});

		await test.step('Agent clicks edit and updates visitor custom field', async () => {
			await poHomeChannel.contacts.contactInfo.btnEdit.click();
			await poHomeChannel.contacts.contactInfo.getVisitorCustomField(visitorCustomFieldLabel).fill(updatedVisitorCustomFieldValue);
			await poHomeChannel.contacts.contactInfo.btnSave.click();
		});

		await test.step('Assert custom field is updated successfully', async () => {
			await expect(poHomeChannel.contacts.contactInfo.getInfoByValue(updatedVisitorCustomFieldValue)).toBeVisible();
		});
	});
});
