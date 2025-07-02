import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('OC - Canned Responses Usage', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };
	let agent: { page: Page; poHomeChannel: HomeOmnichannel };
	let cannedResponseId: string;
	let placeholderResponseId: string;
	let secondResponseId: string;

	const cannedResponseName = `test-${faker.string.uuid()}`;
	const cannedResponseText = 'Hello! Welcome to our support chat. How can I assist you today?';
	const cannedResponseWithPlaceholder = `Hello {{contact.name}}, thank you for contacting us!`;
	const placeholderResponseName = `placeholder-${faker.string.uuid()}`;
	const secondResponseName = `followup-${faker.string.uuid()}`;
	const secondResponseText = 'Is there anything else I can help you with today?';

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
			api.post('/canned-responses', {
				shortcut: cannedResponseName,
				text: cannedResponseText,
				scope: 'global',
				tags: ['tag'],
			}),
			api.post('/canned-responses', {
				shortcut: placeholderResponseName,
				text: cannedResponseWithPlaceholder,
				scope: 'global',
				tags: ['tag'],
			}),
			api.post('/canned-responses', {
				shortcut: secondResponseName,
				text: secondResponseText,
				scope: 'global',
				tags: ['tag'],
			}),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };

		const [mainResponse, placeholderResponse, secondResponse] = await Promise.all([
			api.get('/canned-responses', { shortcut: cannedResponseName }),
			api.get('/canned-responses', { shortcut: placeholderResponseName }),
			api.get('/canned-responses', { shortcut: secondResponseName }),
		]);

		const [mainData, placeholderData, secondData] = await Promise.all([
			mainResponse.json(),
			placeholderResponse.json(),
			secondResponse.json(),
		]);

		cannedResponseId = mainData.cannedResponses[0]._id;
		placeholderResponseId = placeholderData.cannedResponses[0]._id;
		secondResponseId = secondData.cannedResponses[0]._id;
	});

	test.beforeEach(async ({ page, api }) => {
		newVisitor = createFakeVisitor();
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterEach('close livechat conversation', async () => {
		await poLiveChat.closeChat();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/manager/user1'),
			api.delete('/canned-responses', { _id: cannedResponseId }),
			api.delete('/canned-responses', { _id: placeholderResponseId }),
			api.delete('/canned-responses', { _id: secondResponseId }),
			agent.poHomeChannel.page.close(),
		]);
	});

	test('OC - Canned Responses Usage - Create response and use in chat', async ({ page }) => {
		await test.step('expect to start a visitor conversation', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('expect agent to receive and open the chat', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to use the canned response in the chat', async () => {
			await agent.poHomeChannel.content.useCannedResponse(cannedResponseName);
		});

		await test.step('expect canned response text to appear in message composer', async () => {
			await expect(agent.poHomeChannel.content.inputMessage).toHaveValue(`${cannedResponseText} `);
		});

		await test.step('expect agent to be able to send the canned response message', async () => {
			await agent.poHomeChannel.content.sendMessage(cannedResponseText);
		});

		await test.step('expect visitor to receive the canned response message', async () => {
			await expect(poLiveChat.txtChatMessage(cannedResponseText)).toBeVisible();
		});
	});

	test('OC - Canned Responses Usage - Use response with placeholder replacement', async ({ page }) => {
		await test.step('expect to start a new visitor conversation', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.fill('test_message_for_placeholder');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('expect agent to receive and open the chat', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to use the canned response with placeholder', async () => {
			await agent.poHomeChannel.content.useCannedResponse(placeholderResponseName);
		});

		await test.step('expect placeholder to be replaced with actual visitor name', async () => {
			await agent.poHomeChannel.content.sendMessage(cannedResponseWithPlaceholder);
			await expect(poLiveChat.txtChatMessage('{{contact.name}}')).not.toBeVisible();
		});
	});

	test('OC - Canned Responses Usage - Modify response before sending', async ({ page }) => {
		const modifiedText = `Additionally, I'll be happy to help you with any specific questions.`;

		await test.step('expect to start a visitor conversation', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.fill('test_message_for_modification');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('expect agent to open the chat', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to use existing canned response and modify it', async () => {
			await agent.poHomeChannel.content.useCannedResponse(cannedResponseName);
		});

		await test.step('expect to modify the canned response text before sending', async () => {
			await agent.poHomeChannel.content.inputMessage.click();
			await agent.page.keyboard.press('End');
			await agent.page.keyboard.type(modifiedText);

			await expect(agent.poHomeChannel.content.inputMessage).toHaveValue(`${cannedResponseText} ${modifiedText}`);
		});

		await test.step('expect to send the modified message', async () => {
			await agent.page.keyboard.press('Enter');
		});

		await test.step('expect visitor to receive the modified message', async () => {
			await expect(poLiveChat.txtChatMessage(`${cannedResponseText} ${modifiedText}`)).toBeVisible();
		});
	});

	test('OC - Canned Responses Usage - Use multiple responses in sequence', async ({ page }) => {
		await test.step('expect to start a visitor conversation', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.fill('test_message_for_sequence');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('expect agent to open the chat', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to use first canned response', async () => {
			await agent.poHomeChannel.content.useCannedResponse(cannedResponseName);
			await expect(agent.poHomeChannel.content.inputMessage).toHaveValue(`${cannedResponseText} `);
			await agent.page.keyboard.press('Enter');
		});

		await test.step('expect to use second canned response', async () => {
			await agent.poHomeChannel.content.useCannedResponse(secondResponseName);
			await expect(agent.poHomeChannel.content.inputMessage).toHaveValue(`${secondResponseText} `);
			await agent.page.keyboard.press('Enter');
		});

		await test.step('expect visitor to receive both messages in correct order', async () => {
			await expect(poLiveChat.txtChatMessage(cannedResponseText)).toBeVisible();
			await expect(poLiveChat.txtChatMessage(secondResponseText)).toBeVisible();
		});
	});
});
