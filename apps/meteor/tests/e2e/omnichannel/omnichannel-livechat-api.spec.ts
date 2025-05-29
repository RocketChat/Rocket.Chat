import { faker } from '@faker-js/faker/locale/af_ZA';
import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

// TODO: Use official widget typing once that is merged
declare const window: Window & {
	// TODO: Improve tests to no longer use window object properties
	onPrechatFormSubmit: boolean;
	onAssignAgent: boolean;
	onAgentStatusChange: boolean;
	onOfflineFormSubmit: boolean;
	onChatStarted: boolean;
	onChatEnded: boolean;

	RocketChat: {
		livechat: {
			clearBusinessUnit: () => void;
			clearDepartment: () => void;
			initialize: () => void;
			maximizeWidget: () => void;
			minimizeWidget: () => void;
			hideWidget: () => void;
			showWidget: () => void;
			pageVisited: () => void;
			registerGuest: (visitor: { name: string; email: string; token: string }) => void;
			setAgent: (agent: { username: string; _id: string }) => void;
			setBusinessUnit: (businessUnit?: string) => void;
			setCustomField: (field: { key: string; value: string }) => void;
			setDepartment: (dep: string) => void;
			setGuestEmail: (email: string) => void;
			setGuestName: (name: string) => void;
			setGuestToken: (token: string) => void;
			setParentUrl: (url: string) => void;
			setTheme: (theme: { color?: string; fontColor?: string; iconColor?: string; title?: string; offlineTitle?: string }) => void;
			setLanguage: (language: string) => void;
			transferChat: (department: string) => void;
			onChatMaximized: (callback: () => void) => void;
			onChatMinimized: (callback: () => void) => void;
			onChatStarted: (callback: () => void) => void;
			onChatEnded: (callback: () => void) => void;
			onPrechatFormSubmit: (callback: () => void) => void;
			onAssignAgent: (callback: () => void) => void;
			onAgentStatusChange: (callback: () => void) => void;
			onOfflineFormSubmit: (callback: () => void) => void;
			onWidgetHidden: (callback: () => void) => void;
			onWidgetShown: (callback: () => void) => void;
			onServiceOffline: (callback: () => void) => void;
			onQueuePositionChange: (callback: () => void) => void;
		};
	};
};

const createFakeVisitorRegistration = (extra?: { department?: string }) => ({
	...createFakeVisitor(),
	token: faker.string.uuid(),
	...extra,
});

test.describe('OC - Livechat API', () => {
	// TODO: Check if there is a way to add livechat to the global window object

	test.describe('Basic Widget Interactions', () => {
		// Tests that rely only on the widget itself, without requiring further interaction from the main RC app
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChatEmbedded;
		let page: Page;
		let agent: Awaited<ReturnType<typeof createAgent>>;

		test.beforeAll(async ({ browser, api }) => {
			agent = await createAgent(api, 'user1');

			page = await browser.newPage();

			poLiveChat = new OmnichannelLiveChatEmbedded(page);

			const { page: pageCtx } = await createAuxContext(browser, Users.user1);
			poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async () => {
			await agent.delete();
			await poAuxContext.page.close();
			await page.close();
		});

		test('OC - Livechat API - Open and Close widget', async () => {
			await test.step('Expect widget to be visible after maximizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();
			});

			await test.step('Expect widget not be visible after minimizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.minimizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();
			});
		});

		test('OC - Livechat API - Show and Hide widget', async () => {
			await test.step('Expect livechat button not be visible after minimizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.hideWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByRole('button', { name: 'Rocket.Chat' })).not.toBeVisible();
			});

			await test.step('Expect livechat button to be visible after show()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.showWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByRole('button', { name: 'Rocket.Chat' })).toBeVisible();
			});
		});

		test.skip('OC - Livechat API - setAgent', async () => {
			// Set agent does not actually set the agent, it just sets the default agent on the widget state
			// Maybe that is used in an integration? Since as it is now, when the user starts a chat, the agent will be overriden
			// TODO: Find the use case of the setAgent method
			await test.step('Expect setAgent to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setAgent({ username: 'user1', _id: 'user1' }));
			});
		});

		test('OC - Livechat API - setLanguage', async () => {
			await test.step('Expect language to be pt-BR', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setLanguage('pt-BR'));

				await expect(
					page.frameLocator('#rocketchat-iframe').getByText('Por favor, nos passe algumas informações antes de iniciar o chat'),
				).toBeVisible();
			});

			await test.step('Expect language to be en', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setLanguage('en'));

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Please, tell us some information to start the chat')).toBeVisible();
			});
		});

		test('OC - Livechat API - setTheme', async () => {
			const registerGuestVisitor = createFakeVisitorRegistration();

			await test.step('Expect setTheme set color', async () => {
				await poLiveChat.page.evaluate(() => {
					window.RocketChat.livechat.maximizeWidget();
					window.RocketChat.livechat.setTheme({ color: 'rgb(50, 50, 50)' });
				});

				await expect(page.frameLocator('#rocketchat-iframe').locator('header')).toHaveCSS('background-color', 'rgb(50, 50, 50)');
			});

			await test.step('Expect setTheme set fontColor', async () => {
				await poLiveChat.page.evaluate(() => {
					window.RocketChat.livechat.maximizeWidget();
					window.RocketChat.livechat.setTheme({ fontColor: 'rgb(50, 50, 50)' });
				});

				await expect(page.frameLocator('#rocketchat-iframe').locator('header')).toHaveCSS('color', 'rgb(50, 50, 50)');
			});

			// TODO: fix iconColor setTheme property
			// await test.step('Expect setTheme set iconColor', async () => {
			// 	await poLiveChat.page.evaluate(() => {
			// 		window.RocketChat.livechat.maximizeWidget();
			// 		window.RocketChat.livechat.setTheme({ iconColor: 'rgb(50, 50, 50)' });
			// 	});

			// 	await expect(page.frameLocator('#rocketchat-iframe').locator('header')).toHaveCSS('color', 'rgb(50, 50, 50)');
			// });

			await test.step('Expect setTheme set title', async () => {
				await poLiveChat.page.evaluate(() => {
					window.RocketChat.livechat.maximizeWidget();
					window.RocketChat.livechat.setTheme({ title: 'CustomTitle' });
				});

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(page.frameLocator('#rocketchat-iframe').getByText('CustomTitle')).toBeVisible();
			});

			// await test.step('Expect setTheme set offlineTitle', async () => {
			// 	await poLiveChat.page.evaluate(() => {
			// 		window.RocketChat.livechat.maximizeWidget();
			// 		window.RocketChat.livechat.setTheme({ offlineTitle: 'CustomOfflineTitle' });
			// 	});

			// 	await expect(page.frameLocator('#rocketchat-iframe').getByText('CustomTitle')).toBeVisible();
			// });
		});

		test.skip('OC - Livechat API - setParentUrl', async () => {
			// TODO: check how to test this, not sure there is a clear indication of parent url changes
			await test.step('Expect setParentUrl to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setParentUrl('http://localhost:3000'));
			});
		});
	});

	test.describe('Complex Widget Interactions', () => {
		// Needs Departments to test this, so needs an EE license for multiple deps
		test.skip(!IS_EE, 'Enterprise Only');
		// Tests that requires interaction from an agent or more
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChatEmbedded;
		let page: Page;
		let agent: Awaited<ReturnType<typeof createAgent>>;
		let agent2: Awaited<ReturnType<typeof createAgent>>;
		let departments: Awaited<ReturnType<typeof createDepartment>>[];
		let pageContext: Page;

		test.beforeAll(async ({ api }) => {
			agent = await createAgent(api, 'user1');
			agent2 = await createAgent(api, 'user2');

			departments = await Promise.all([createDepartment(api), createDepartment(api)]);
			const [departmentA, departmentB] = departments.map(({ data }) => data);

			await addAgentToDepartment(api, { department: departmentA, agentId: agent.data._id });
			await addAgentToDepartment(api, { department: departmentB, agentId: agent2.data._id });
			expect((await api.post('/settings/Livechat_offline_email', { value: 'test@testing.com' })).status()).toBe(200);
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false });
		});

		test.beforeEach(async ({ browser }, testInfo) => {
			page = await browser.newPage();

			poLiveChat = new OmnichannelLiveChatEmbedded(page);

			const { page: pageCtx } = await createAuxContext(browser, Users.user1);
			poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };

			// This is needed since the livechat will not react to online/offline status changes if already loaded in a page
			if (testInfo.title === 'Expect onOfflineFormSubmit to trigger callback') {
				await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');
			} else {
				await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('online');
			}

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterEach(async () => {
			await poAuxContext.page.close();
			await page.close();
			await pageContext?.close();
		});

		test.afterAll(async ({ api }) => {
			await agent.delete();
			await agent2.delete();

			await expect((await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status()).toBe(200);
			await Promise.all([...departments.map((department) => department.delete())]);
			await expect((await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status()).toBe(200);
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: true });
		});

		// clearBusinessUnit
		// clearDepartment
		// initialize
		// maximizeWidget
		// minimizeWidget
		// pageVisited
		// registerGuest
		// setAgent
		// setBusinessUnit
		// setCustomField
		// setDepartment
		// setGuestEmail
		// setGuestName
		// setGuestToken
		// setParentUrl
		// setTheme

		test.skip('OC - Livechat API - clearBusinessUnit', async () => {
			// TODO: check how to test this, and if this is working as intended
			await test.step('Expect clearBusinessUnit to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.clearBusinessUnit());
			});
		});

		test.skip('OC - Livechat API - setBusinessUnit', async () => {
			// TODO
			await test.step('Expect setBusinessUnit to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setBusinessUnit());
			});
		});

		test.skip('OC - Livechat API - setCustomField', async () => {
			// TODO
			await test.step('Expect setCustomField to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setCustomField({ key: 'test', value: 'test' }));
			});
		});

		test.skip('OC - Livechat API - clearDepartment', async () => {
			// TODO
			await test.step('Expect clearDepartment to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.clearDepartment());
			});
		});

		test.describe('OC - Livechat API - setDepartment', () => {
			let poAuxContext2: { page: Page; poHomeOmnichannel: HomeOmnichannel };

			test.beforeEach(async ({ browser }) => {
				const { page: pageCtx2 } = await createAuxContext(browser, Users.user2);
				poAuxContext2 = { page: pageCtx2, poHomeOmnichannel: new HomeOmnichannel(pageCtx2) };
			});

			test.afterEach(async () => {
				await poAuxContext2.page.close();
			});

			test('setDepartment - Called during ongoing conversation', async () => {
				const [departmentA, departmentB] = departments.map(({ data }) => data);
				const registerGuestVisitor = createFakeVisitorRegistration({
					department: departmentA._id,
				});

				// Start Chat
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await test.step('Expect registered guest to be in dep1', async () => {
					await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
					await expect(poAuxContext.poHomeOmnichannel.content.channelHeader).toContainText(registerGuestVisitor.name);
				});

				const depId = departmentB._id;

				await test.step('Expect chat not be transferred', async () => {
					await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.setDepartment(depId), depId);

					await poAuxContext2.page.locator('role=navigation >> role=button[name=Search]').click();
					await poAuxContext2.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
					await expect(
						poAuxContext2.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`),
					).not.toBeVisible();
				});

				await test.step('Expect registered guest to still be in dep1', async () => {
					await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
					await expect(poAuxContext.poHomeOmnichannel.content.channelHeader).toContainText(registerGuestVisitor.name);
				});
			});

			test('setDepartment - Called before conversation', async () => {
				const departmentB = departments[1].data;
				const registerGuestVisitor = createFakeVisitor();

				const depId = departmentB._id;

				await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.setDepartment(depId), depId);

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await poLiveChat.sendMessage(registerGuestVisitor, false);

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await test.step('Expect registered guest to be in dep2', async () => {
					await poAuxContext2.page.locator('role=navigation >> role=button[name=Search]').click();
					await poAuxContext2.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
					await poAuxContext2.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`).click();
					await poAuxContext2.page.locator('role=main').waitFor();
					await poAuxContext2.page.locator('role=main >> role=heading[level=1]').waitFor();
					await expect(poAuxContext2.page.locator('role=main >> .rcx-skeleton')).toHaveCount(0);
					await expect(poAuxContext2.page.locator('role=main >> role=list')).not.toHaveAttribute('aria-busy', 'true');
				});

				await test.step('Expect registered guest not to be in dep1', async () => {
					await poAuxContext.page.locator('role=navigation >> role=button[name=Search]').click();
					await poAuxContext.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
					await expect(
						poAuxContext.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`),
					).not.toBeVisible();
				});
			});
		});

		test.describe('OC - Livechat API - transferChat', () => {
			let poAuxContext2: { page: Page; poHomeOmnichannel: HomeOmnichannel };

			test.beforeEach(async ({ browser }) => {
				const { page: pageCtx2 } = await createAuxContext(browser, Users.user2);
				poAuxContext2 = { page: pageCtx2, poHomeOmnichannel: new HomeOmnichannel(pageCtx2) };
			});

			test.afterEach(async () => {
				await poAuxContext2.page.close();
			});

			test('transferChat - Called during ongoing conversation', async () => {
				const [departmentA, departmentB] = departments.map(({ data }) => data);
				const registerGuestVisitor = createFakeVisitorRegistration({
					department: departmentA._id,
				});

				// Start Chat
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await test.step('Expect registered guest to be in dep1', async () => {
					await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
					await expect(poAuxContext.poHomeOmnichannel.content.channelHeader).toContainText(registerGuestVisitor.name);
				});

				const depId = departmentB._id;

				await test.step('Expect chat to be transferred', async () => {
					await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.transferChat(depId), depId);

					await poAuxContext2.page.locator('role=navigation >> role=button[name=Search]').click();
					await poAuxContext2.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
					await expect(
						poAuxContext2.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`),
					).toBeVisible();
				});
			});
		});

		test('OC - Livechat API - registerGuest', async ({ browser }) => {
			const registerGuestVisitor = createFakeVisitorRegistration();

			await test.step('Expect registerGuest to create a valid guest', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();
			});

			await test.step('Expect registered guest to have valid info', async () => {
				await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);

				await poAuxContext.poHomeOmnichannel.content.btnGuestInfo.click();
				// For some reason the guest info email information is being set to lowercase
				await expect(poAuxContext.poHomeOmnichannel.content.infoContactEmail).toHaveText(registerGuestVisitor.email.toLowerCase());
			});

			await test.step('Expect registerGuest to log in an existing guest and load chat history', async () => {
				({ page: pageContext } = await createAuxContext(browser, Users.user1));

				await pageContext.goto('/packages/rocketchat_livechat/assets/demo.html');

				await pageContext.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(pageContext.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await pageContext.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(pageContext.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();
				await expect(pageContext.frameLocator('#rocketchat-iframe').getByText('this_a_test_message_from_visitor')).toBeVisible();
			});
		});

		test('OC - Livechat API - registerGuest different guests', async () => {
			const registerGuestVisitor1 = createFakeVisitorRegistration();

			const registerGuestVisitor2 = createFakeVisitorRegistration();

			await test.step('Expect registerGuest to create guest 1', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(poLiveChat.page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor1) => window.RocketChat.livechat.registerGuest(registerGuestVisitor1),
					registerGuestVisitor1,
				);

				await expect(poLiveChat.page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor_1');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor_1')).toBeVisible();

				await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor1.name);
				await poAuxContext.poHomeOmnichannel.content.sendMessage('this_is_a_test_message_from_agent');
				await expect(poLiveChat.txtChatMessage('this_is_a_test_message_from_agent')).toBeVisible();
			});

			await test.step('Expect registerGuest to create guest 2', async () => {
				await poLiveChat.page.evaluate(
					(registerGuestVisitor2) => window.RocketChat.livechat.registerGuest(registerGuestVisitor2),
					registerGuestVisitor2,
				);

				// wait for load messages to happen
				await page.waitForResponse((response) => response.url().includes(`token=${registerGuestVisitor2.token}`));

				await poLiveChat.page
					.frameLocator('#rocketchat-iframe')
					.getByText('this_a_test_message_from_visitor_1')
					.waitFor({ state: 'hidden' });

				await expect(poLiveChat.page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor_2');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await poLiveChat.txtChatMessage('this_a_test_message_from_visitor_2').waitFor({ state: 'visible' });
				await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor_2')).toBeVisible();
			});
		});

		test('OC - Livechat API - registerGuest multiple times', async () => {
			const registerGuestVisitor = createFakeVisitorRegistration();

			await test.step('Expect registerGuest work with the same token, multiple times', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

				await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();

				await poLiveChat.page.evaluate((registerGuestVisitor) => {
					window.RocketChat.livechat.registerGuest(registerGuestVisitor);
					window.RocketChat.livechat.registerGuest(registerGuestVisitor);
				}, registerGuestVisitor);

				await page.waitForResponse('**/api/v1/livechat/visitor');
				await page.waitForTimeout(500); // NOTE: timeout is necessary to allow websocket unsubscribes to happen

				await poLiveChat.onlineAgentMessage.fill('this_a_new_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();
				await expect(poLiveChat.txtChatMessage('this_a_new_test_message_from_visitor')).toBeVisible();
			});
		});

		test.skip('OC - Livechat API - setGuestEmail', async () => {
			const registerGuestVisitor = createFakeVisitorRegistration();
			// Start Chat
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await test.step('Expect setGuestEmail to change a guest email', async () => {
				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.setGuestEmail(`changed${registerGuestVisitor.email}`),
					registerGuestVisitor,
				);
			});

			await test.step('Expect registered guest to have valid info', async () => {
				await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);

				await poAuxContext.poHomeOmnichannel.content.btnGuestInfo.click();
				// For some reason the guest info email information is being set to lowercase
				await expect(poAuxContext.poHomeOmnichannel.content.infoContactEmail).toHaveText(
					`changed${registerGuestVisitor.email}`.toLowerCase(),
				);
			});
		});

		test('OC - Livechat API - setGuestName', async () => {
			const registerGuestVisitor = createFakeVisitorRegistration();
			// Start Chat
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);

			await test.step('Expect setGuestEmail to change a guest email', async () => {
				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.setGuestName(`changed${registerGuestVisitor.name}`),
					registerGuestVisitor,
				);
			});

			await test.step('Expect registered guest to have valid info', async () => {
				await expect(poAuxContext.poHomeOmnichannel.content.infoHeaderName).toContainText(`changed${registerGuestVisitor.name}`);
			});
		});

		test('OC - Livechat API - setGuestToken', async ({ browser }) => {
			const registerGuestVisitor = createFakeVisitorRegistration();

			// Register guest and send a message
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await test.step('Expect setGuestToken to log in an existing guest and load chat history', async () => {
				({ page: pageContext } = await createAuxContext(browser, Users.user1));

				await pageContext.goto('/packages/rocketchat_livechat/assets/demo.html');

				await pageContext.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(pageContext.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();

				await pageContext.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.setGuestToken(registerGuestVisitor.token),
					registerGuestVisitor,
				);

				await expect(pageContext.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();
				await expect(pageContext.frameLocator('#rocketchat-iframe').getByText('this_a_test_message_from_visitor')).toBeVisible();
			});
		});
	});

	test.describe('Widget Listeners', () => {
		// Tests that listen to events from the widget, and check if they are being triggered

		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChatEmbedded;
		let page: Page;
		let agent: Awaited<ReturnType<typeof createAgent>>;

		test.beforeAll(async ({ api }) => {
			agent = await createAgent(api, 'user1');
			expect((await api.post('/settings/Livechat_offline_email', { value: 'test@testing.com' })).status()).toBe(200);
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false });
		});

		test.beforeEach(async ({ browser }, testInfo) => {
			page = await browser.newPage();

			poLiveChat = new OmnichannelLiveChatEmbedded(page);

			const { page: pageCtx } = await createAuxContext(browser, Users.user1);
			poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };

			// This is needed since the livechat will not react to online/offline status changes if already loaded in a page
			if (testInfo.title === 'Expect onOfflineFormSubmit to trigger callback') {
				await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');
			} else {
				await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('online');
			}

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterEach(async () => {
			await poAuxContext.page.close();
			await page.close();
		});

		test.afterAll(async ({ api }) => {
			await agent.delete();
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: true });
		});

		test('OC - Livechat API - onChatMaximized & onChatMinimized', async () => {
			await test.step('Expect onChatMaximized to trigger callback', async () => {
				await poLiveChat.page.evaluate(
					() =>
						new Promise((resolve: (value?: unknown) => void) => {
							window.RocketChat.livechat.onChatMaximized(() => {
								resolve();
							});

							window.RocketChat.livechat.maximizeWidget();
						}),
				);
			});

			await test.step('Expect onChatMinimized to trigger callback', async () => {
				await poLiveChat.page.evaluate(
					() =>
						new Promise((resolve: (value?: unknown) => void) => {
							window.RocketChat.livechat.onChatMinimized(() => {
								resolve();
							});

							window.RocketChat.livechat.minimizeWidget();
						}),
				);
			});
		});

		test('OC - Livechat API - onChatStarted & onChatEnded', async () => {
			const newVisitor = createFakeVisitor();

			await test.step('Expect onChatStarted to trigger callback', async () => {
				const watchForTrigger = page.waitForFunction(() => window.onChatStarted === true);

				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onChatStarted(() => {
						window.onChatStarted = true;
					}),
				);

				await poLiveChat.openLiveChat();
				await poLiveChat.sendMessage(newVisitor, false);
				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await watchForTrigger;
			});

			await test.step('Expect onChatEnded to trigger callback', async () => {
				const watchForTrigger = page.waitForFunction(() => window.onChatEnded === true);

				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onChatEnded(() => {
						window.onChatEnded = true;
					}),
				);

				await poAuxContext.poHomeOmnichannel.sidenav.openChat(newVisitor.name);
				await poAuxContext.poHomeOmnichannel.content.btnCloseChat.click();
				await poAuxContext.poHomeOmnichannel.content.closeChatModal.inputComment.fill('this_is_a_test_comment');
				await poAuxContext.poHomeOmnichannel.content.closeChatModal.btnConfirm.click();
				await expect(poAuxContext.poHomeOmnichannel.toastSuccess).toBeVisible();

				await watchForTrigger;
			});
		});

		test('OC - Livechat API - onPrechatFormSubmit & onAssignAgent', async () => {
			const newVisitor = createFakeVisitor();

			await test.step('Expect onPrechatFormSubmit to trigger callback', async () => {
				const watchForTrigger = page.waitForFunction(() => window.onPrechatFormSubmit === true);

				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onPrechatFormSubmit(() => {
						window.onPrechatFormSubmit = true;
					}),
				);

				await poLiveChat.openLiveChat();
				await poLiveChat.sendMessage(newVisitor, false);
				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await watchForTrigger;
			});

			await test.step('Expect onAssignAgent to trigger callback', async () => {
				const watchForTrigger = page.waitForFunction(() => window.onAssignAgent === true);

				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onAssignAgent(() => {
						window.onAssignAgent = true;
					}),
				);

				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await watchForTrigger;
			});
		});

		// TODO: Fix this Flaky test
		test.skip('onAgentStatusChange', async () => {
			const newVisitor = createFakeVisitor();

			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			const watchForTrigger = page.waitForFunction(() => window.onAgentStatusChange === true);

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onAgentStatusChange(() => {
					window.onAgentStatusChange = true;
				}),
			);

			await poAuxContext.poHomeOmnichannel.sidenav.openChat(newVisitor.name);
			await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');

			await watchForTrigger;
		});

		test('OC - Livechat API - onOfflineFormSubmit', async () => {
			const newVisitor = createFakeVisitor();

			await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');
			await poAuxContext.poHomeOmnichannel.sidenav.switchOmnichannelStatus('offline');

			const watchForTrigger = page.waitForFunction(() => window.onOfflineFormSubmit === true);

			await poLiveChat.page.reload();

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onOfflineFormSubmit(() => {
					window.onOfflineFormSubmit = true;
				}),
			);

			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, true);

			await watchForTrigger;
		});

		test('OC - Livechat API - onWidgetHidden & onWidgetShown', async () => {
			await test.step('Expect onWidgetHidden to trigger callback', async () => {
				await poLiveChat.page.evaluate(
					() =>
						new Promise((resolve: (value?: unknown) => void) => {
							window.RocketChat.livechat.onWidgetHidden(() => {
								resolve();
							});

							window.RocketChat.livechat.hideWidget();
						}),
				);
			});

			await test.step('Expect onWidgetShown to trigger callback', async () => {
				await poLiveChat.page.evaluate(
					() =>
						new Promise((resolve: (value?: unknown) => void) => {
							window.RocketChat.livechat.onWidgetShown(() => {
								resolve();
							});

							window.RocketChat.livechat.showWidget();
						}),
				);
			});
		});

		test.skip('OC - Livechat API - onServiceOffline', async () => {
			// TODO: Not sure how to test this, need to check if playwright has a way to mock a server disconnect
			await test.step('Expect onServiceOffline to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.onServiceOffline(() => console.log('onServiceOffline')));
			});
		});

		test.skip('OC - Livechat API - onQueuePositionChange', async () => {
			// TODO
			await test.step('Expect onQueuePositionChange to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.onQueuePositionChange(() => console.log('onQueuePositionChange')));
			});
		});
	});
});
