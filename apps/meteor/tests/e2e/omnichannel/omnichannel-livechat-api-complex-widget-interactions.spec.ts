import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
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
		await setSettingValueById(api, 'Livechat_offline_email', 'test@testing.com');
	});

	test.beforeEach(async ({ browser, api }, testInfo) => {
		page = await browser.newPage();

		poLiveChat = new OmnichannelLiveChatEmbedded(page, api);

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
		await Promise.all([
			deleteClosedRooms(api),
			agent.delete(),
			agent2.delete(),
			setSettingValueById(api, 'Omnichannel_enable_department_removal', true),
			setSettingValueById(api, 'Omnichannel_enable_department_removal', false),
			...departments.map((department) => department.delete()),
		]);
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
		await test.step('expect clearBusinessUnit to do something', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.clearBusinessUnit());
		});
	});

	test.skip('OC - Livechat API - setBusinessUnit', async () => {
		// TODO
		await test.step('expect setBusinessUnit to do something', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setBusinessUnit());
		});
	});

	test.skip('OC - Livechat API - setCustomField', async () => {
		// TODO
		await test.step('expect setCustomField to do something', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setCustomField({ key: 'test', value: 'test' }));
		});
	});

	test.skip('OC - Livechat API - clearDepartment', async () => {
		// TODO
		await test.step('expect clearDepartment to do something', async () => {
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

			await test.step('expect to register guest and send message', async () => {
				// Start Chat
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(poLiveChat.btnStartChat).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(poLiveChat.btnStartChat).not.toBeVisible();

				await poLiveChat.sendMessage('this_a_test_message_from_visitor');
			});

			await test.step('expect registered guest to be in dep1', async () => {
				await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
				await expect(poAuxContext.poHomeOmnichannel.content.channelHeader).toContainText(registerGuestVisitor.name);
			});

			await test.step('expect chat not be transferred', async () => {
				await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.setDepartment(depId), departmentB._id);

				await poAuxContext2.page.locator('role=navigation >> role=button[name=Search]').click();
				await poAuxContext2.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
				await expect(
					poAuxContext2.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`),
				).not.toBeVisible();
			});

			await test.step('expect registered guest to still be in dep1', async () => {
				await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
				await expect(poAuxContext.poHomeOmnichannel.content.channelHeader).toContainText(registerGuestVisitor.name);
			});

			await test.step('expect to close livechat conversation', async () => {
				await poLiveChat.closeChat();
			});
		});

		test('setDepartment - Called before conversation', async () => {
			const departmentB = departments[1].data;
			const registerGuestVisitor = createFakeVisitor();

			await test.step('expect to register guest and send message', async () => {
				await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.setDepartment(depId), departmentB._id);

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(poLiveChat.btnStartChat).toBeVisible();

				await poLiveChat.registerVisitor(registerGuestVisitor);

				await poLiveChat.sendMessage('this_a_test_message_from_visitor');
			});

			await test.step('expect registered guest to be in dep2', async () => {
				await poAuxContext2.page.locator('role=navigation >> role=button[name=Search]').click();
				await poAuxContext2.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
				await poAuxContext2.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`).click();
				await poAuxContext2.page.locator('role=main').waitFor();
				await poAuxContext2.page.locator('role=main >> role=heading[level=1]').waitFor();
				await expect(poAuxContext2.page.locator('role=main >> .rcx-skeleton')).toHaveCount(0);
				await expect(poAuxContext2.page.locator('role=main >> role=list')).not.toHaveAttribute('aria-busy', 'true');
			});

			await test.step('expect registered guest not to be in dep1', async () => {
				await poAuxContext.page.locator('role=navigation >> role=button[name=Search]').click();
				await poAuxContext.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
				await expect(
					poAuxContext.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`),
				).not.toBeVisible();
			});

			await test.step('expect to close livechat conversation', async () => {
				await poLiveChat.closeChat();
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

			await test.step('expect to register guest and send message', async () => {
				// Start Chat
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
				await expect(poLiveChat.btnStartChat).toBeVisible();

				await poLiveChat.page.evaluate(
					(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
					registerGuestVisitor,
				);

				await expect(poLiveChat.btnStartChat).not.toBeVisible();

				await poLiveChat.sendMessage('this_a_test_message_from_visitor');
			});

			await test.step('expect registered guest to be in dep1', async () => {
				await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
				await expect(poAuxContext.poHomeOmnichannel.content.channelHeader).toContainText(registerGuestVisitor.name);
			});

			await test.step('expect chat to be transferred', async () => {
				await poLiveChat.page.evaluate((depId) => window.RocketChat.livechat.transferChat(depId), departmentB._id);

				await poAuxContext2.page.locator('role=navigation >> role=button[name=Search]').click();
				await poAuxContext2.page.locator('role=search >> role=searchbox').fill(registerGuestVisitor.name);
				await expect(
					poAuxContext2.page.locator(`role=search >> role=listbox >> role=link >> text="${registerGuestVisitor.name}"`),
				).toBeVisible();
			});

			await test.step('expect to close livechat conversation', async () => {
				await poLiveChat.closeChat();
			});
		});
	});

	test('OC - Livechat API - registerGuest', async ({ browser }) => {
		const registerGuestVisitor = createFakeVisitorRegistration();

		await test.step('expect registerGuest to create a valid guest', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(poLiveChat.btnStartChat).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor');
		});

		await test.step('expect registered guest to have valid info', async () => {
			await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);

			await poAuxContext.poHomeOmnichannel.content.btnGuestInfo.click();
			// For some reason the guest info email information is being set to lowercase
			await expect(poAuxContext.poHomeOmnichannel.content.infoContactEmail).toHaveText(registerGuestVisitor.email.toLowerCase());
		});

		await test.step('expect registerGuest to log in an existing guest and load chat history', async () => {
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

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});

	test('OC - Livechat API - registerGuest different guests', async () => {
		const registerGuestVisitor1 = createFakeVisitorRegistration();
		const registerGuestVisitor2 = createFakeVisitorRegistration();

		await test.step('expect registerGuest to create guest 1', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(poLiveChat.btnStartChat).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor1) => window.RocketChat.livechat.registerGuest(registerGuestVisitor1),
				registerGuestVisitor1,
			);

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor_1');

			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor_1')).toBeVisible();

			await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor1.name);
			await poAuxContext.poHomeOmnichannel.content.sendMessage('this_is_a_test_message_from_agent');
			await expect(poLiveChat.txtChatMessage('this_is_a_test_message_from_agent')).toBeVisible();
		});

		await test.step('expect registerGuest to create guest 2', async () => {
			await poLiveChat.page.evaluate(
				(registerGuestVisitor2) => window.RocketChat.livechat.registerGuest(registerGuestVisitor2),
				registerGuestVisitor2,
			);

			// wait for load messages to happen
			await page.waitForResponse((response) => response.url().includes(`token=${registerGuestVisitor2.token}`));

			await poLiveChat.txtChatMessage('this_a_test_message_from_visitor_1').waitFor({ state: 'hidden' });

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor_2');

			await poLiveChat.txtChatMessage('this_a_test_message_from_visitor_2').waitFor({ state: 'visible' });
			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor_2')).toBeVisible();
		});

		await test.step('expect to close livechat conversation', async () => {
			await poAuxContext.poHomeOmnichannel.content.closeChat();
			await poLiveChat.closeChat();
		});
	});

	test('OC - Livechat API - registerGuest multiple times', async () => {
		const registerGuestVisitor = createFakeVisitorRegistration();

		await test.step('expect registerGuest work with the same token, multiple times', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(poLiveChat.btnStartChat).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor');

			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await page.waitForResponse('**/api/v1/livechat/visitor');

			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await page.waitForResponse('**/api/v1/livechat/visitor');

			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});

	test.skip('OC - Livechat API - setGuestEmail', async () => {
		const registerGuestVisitor = createFakeVisitorRegistration();

		await test.step('expect to register guest and send message', async () => {
			// Start Chat
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(poLiveChat.btnStartChat).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor');
		});

		await test.step('expect setGuestEmail to change a guest email', async () => {
			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.setGuestEmail(`changed${registerGuestVisitor.email}`),
				registerGuestVisitor,
			);
		});

		await test.step('expect registered guest to have valid info', async () => {
			await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);

			await poAuxContext.poHomeOmnichannel.content.btnGuestInfo.click();
			// For some reason the guest info email information is being set to lowercase
			await expect(poAuxContext.poHomeOmnichannel.content.infoContactEmail).toHaveText(
				`changed${registerGuestVisitor.email}`.toLowerCase(),
			);
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});

	test('OC - Livechat API - setGuestName', async () => {
		const registerGuestVisitor = createFakeVisitorRegistration();

		await test.step('expect to register guest and send message', async () => {
			// Start Chat
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());
			await expect(poLiveChat.btnStartChat).toBeVisible();

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor');

			await poAuxContext.poHomeOmnichannel.sidenav.openChat(registerGuestVisitor.name);
		});

		await test.step('expect setGuestEmail to change a guest email', async () => {
			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.setGuestName(`changed${registerGuestVisitor.name}`),
				registerGuestVisitor,
			);
		});

		await test.step('expect registered guest to have valid info', async () => {
			await expect(poAuxContext.poHomeOmnichannel.content.infoHeaderName).toContainText(`changed${registerGuestVisitor.name}`);
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});

	test('OC - Livechat API - setGuestToken', async ({ browser }) => {
		const registerGuestVisitor = createFakeVisitorRegistration();

		await test.step('expect to register guest and send message', async () => {
			// Register guest and send a message
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

			await poLiveChat.page.evaluate(
				(registerGuestVisitor) => window.RocketChat.livechat.registerGuest(registerGuestVisitor),
				registerGuestVisitor,
			);

			await expect(poLiveChat.btnStartChat).not.toBeVisible();

			await poLiveChat.sendMessage('this_a_test_message_from_visitor');
		});

		await test.step('expect setGuestToken to log in an existing guest and load chat history', async () => {
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

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});
});
