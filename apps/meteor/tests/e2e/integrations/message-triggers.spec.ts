import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe.serial('Message Triggers - E2E', () => {
	let admin: { page: Page; poHomeChannel: HomeChannel };
	let user: { page: Page; poHomeChannel: HomeChannel };
	let testChannelName: string;
	let testMessage: string;
	let editedMessage: string;

	test.beforeAll(async ({ api, browser }) => {
		testChannelName = faker.word.noun();
		testMessage = faker.lorem.sentence();
		editedMessage = faker.lorem.sentence();

		// Create test channel
		const response = await api.post('/channels.create', {
			name: testChannelName,
		});
		expect(response.status()).toBe(200);

		// Create admin context
		const { page } = await createAuxContext(browser, Users.admin, '/home');
		admin = { page, poHomeChannel: new HomeChannel(page) };

		// Create user context
		const { page: userPage } = await createAuxContext(browser, Users.user1, '/home');
		user = { page: userPage, poHomeChannel: new HomeChannel(userPage) };
	});

	test.afterAll(async ({ api }) => {
		// Clean up test channel
		await api.delete(`/channels.delete`, { data: { roomName: testChannelName } });
		await admin.page.close();
		await user.page.close();
	});

	test('should create integration for messageEdited trigger', async ({ api }) => {
		const integrationName = 'Message Edited Test Integration';
		const webhookUrl = 'http://example.com/webhook';

		// Create outgoing webhook integration for messageEdited
		const response = await api.post('/integrations.create', {
			type: 'webhook-outgoing',
			name: integrationName,
			enabled: true,
			event: 'messageEdited',
			channel: testChannelName,
			username: 'admin',
			urls: [webhookUrl],
			scriptEnabled: false,
			impersonateUser: false,
		});

		expect(response.status()).toBe(200);
		const integration = await response.json();
		expect(integration.integration).to.have.property('_id');
		expect(integration.integration.name).to.equal(integrationName);
		expect(integration.integration.event).to.equal('messageEdited');
	});

	test('should create integration for messageDeleted trigger', async ({ api }) => {
		const integrationName = 'Message Deleted Test Integration';
		const webhookUrl = 'http://example.com/webhook';

		// Create outgoing webhook integration for messageDeleted
		const response = await api.post('/integrations.create', {
			type: 'webhook-outgoing',
			name: integrationName,
			enabled: true,
			event: 'messageDeleted',
			channel: testChannelName,
			username: 'admin',
			urls: [webhookUrl],
			scriptEnabled: false,
			impersonateUser: false,
		});

		expect(response.status()).toBe(200);
		const integration = await response.json();
		expect(integration.integration).to.have.property('_id');
		expect(integration.integration.name).to.equal(integrationName);
		expect(integration.integration.event).to.equal('messageDeleted');
	});

	test('should send a message and verify it appears in the channel', async () => {
		// Navigate to the test channel
		await admin.poHomeChannel.sidenav.openChannel(testChannelName);

		// Send a message
		await admin.poHomeChannel.content.sendMessage(testMessage);

		// Verify the message appears
		await expect(admin.poHomeChannel.content.lastUserMessage).toContainText(testMessage);
	});

	test('should edit a message and trigger messageEdited event', async ({ api }) => {
		// Get the message ID from the last message
		const messagesResponse = await api.get(`/channels.messages?roomName=${testChannelName}&count=1`);
		expect(messagesResponse.status()).toBe(200);
		const messages = await messagesResponse.json();
		const messageId = messages.messages[0]._id;

		// Edit the message
		const editResponse = await api.post('/chat.update', {
			roomId: messages.messages[0].rid,
			msgId: messageId,
			text: editedMessage,
		});

		expect(editResponse.status()).toBe(200);

		// Verify the message was edited
		await expect(admin.poHomeChannel.content.lastUserMessage).toContainText(editedMessage);

		// Verify the message shows as edited
		await expect(admin.poHomeChannel.content.lastUserMessage).toHaveAttribute('data-is-edited', 'true');
	});

	test('should delete a message and trigger messageDeleted event', async ({ api }) => {
		// Get the message ID from the last message
		const messagesResponse = await api.get(`/channels.messages?roomName=${testChannelName}&count=1`);
		expect(messagesResponse.status()).toBe(200);
		const messages = await messagesResponse.json();
		const messageId = messages.messages[0]._id;

		// Delete the message
		const deleteResponse = await api.post('/chat.delete', {
			roomId: messages.messages[0].rid,
			msgId: messageId,
		});

		expect(deleteResponse.status()).toBe(200);

		// Verify the message was deleted
		await expect(admin.poHomeChannel.content.lastUserMessage).not.toContainText(editedMessage);
	});

	test('should list integrations and verify messageEdited and messageDeleted integrations exist', async ({ api }) => {
		// Get all integrations
		const response = await api.get('/integrations.list');
		expect(response.status()).toBe(200);
		const integrations = await response.json();

		// Find our test integrations
		const messageEditedIntegration = integrations.integrations.find(
			(integration: any) => integration.name === 'Message Edited Test Integration'
		);
		const messageDeletedIntegration = integrations.integrations.find(
			(integration: any) => integration.name === 'Message Deleted Test Integration'
		);

		// Verify both integrations exist
		expect(messageEditedIntegration).to.exist;
		expect(messageEditedIntegration.event).to.equal('messageEdited');
		expect(messageEditedIntegration.enabled).to.be.true;

		expect(messageDeletedIntegration).to.exist;
		expect(messageDeletedIntegration.event).to.equal('messageDeleted');
		expect(messageDeletedIntegration.enabled).to.be.true;
	});

	test('should disable and re-enable messageEdited integration', async ({ api }) => {
		// Get all integrations
		const listResponse = await api.get('/integrations.list');
		expect(listResponse.status()).toBe(200);
		const integrations = await listResponse.json();

		// Find the messageEdited integration
		const messageEditedIntegration = integrations.integrations.find(
			(integration: any) => integration.name === 'Message Edited Test Integration'
		);

		// Disable the integration
		const disableResponse = await api.post('/integrations.update', {
			type: 'webhook-outgoing',
			integrationId: messageEditedIntegration._id,
			enabled: false,
		});

		expect(disableResponse.status()).toBe(200);

		// Verify the integration is disabled
		const updatedListResponse = await api.get('/integrations.list');
		expect(updatedListResponse.status()).toBe(200);
		const updatedIntegrations = await updatedListResponse.json();

		const updatedIntegration = updatedIntegrations.integrations.find(
			(integration: any) => integration._id === messageEditedIntegration._id
		);

		expect(updatedIntegration.enabled).to.be.false;

		// Re-enable the integration
		const enableResponse = await api.post('/integrations.update', {
			type: 'webhook-outgoing',
			integrationId: messageEditedIntegration._id,
			enabled: true,
		});

		expect(enableResponse.status()).toBe(200);

		// Verify the integration is enabled again
		const finalListResponse = await api.get('/integrations.list');
		expect(finalListResponse.status()).toBe(200);
		const finalIntegrations = await finalListResponse.json();

		const finalIntegration = finalIntegrations.integrations.find(
			(integration: any) => integration._id === messageEditedIntegration._id
		);

		expect(finalIntegration.enabled).to.be.true;
	});

	test('should delete test integrations', async ({ api }) => {
		// Get all integrations
		const listResponse = await api.get('/integrations.list');
		expect(listResponse.status()).toBe(200);
		const integrations = await listResponse.json();

		// Find our test integrations
		const messageEditedIntegration = integrations.integrations.find(
			(integration: any) => integration.name === 'Message Edited Test Integration'
		);
		const messageDeletedIntegration = integrations.integrations.find(
			(integration: any) => integration.name === 'Message Deleted Test Integration'
		);

		// Delete messageEdited integration
		if (messageEditedIntegration) {
			const deleteResponse = await api.post('/integrations.remove', {
				integrationId: messageEditedIntegration._id,
				type: 'webhook-outgoing',
			});
			expect(deleteResponse.status()).toBe(200);
		}

		// Delete messageDeleted integration
		if (messageDeletedIntegration) {
			const deleteResponse = await api.post('/integrations.remove', {
				integrationId: messageDeletedIntegration._id,
				type: 'webhook-outgoing',
			});
			expect(deleteResponse.status()).toBe(200);
		}

		// Verify integrations were deleted
		const finalListResponse = await api.get('/integrations.list');
		expect(finalListResponse.status()).toBe(200);
		const finalIntegrations = await finalListResponse.json();

		const remainingMessageEditedIntegration = finalIntegrations.integrations.find(
			(integration: any) => integration.name === 'Message Edited Test Integration'
		);
		const remainingMessageDeletedIntegration = finalIntegrations.integrations.find(
			(integration: any) => integration.name === 'Message Deleted Test Integration'
		);

		expect(remainingMessageEditedIntegration).to.be.undefined;
		expect(remainingMessageDeletedIntegration).to.be.undefined;
	});
}); 