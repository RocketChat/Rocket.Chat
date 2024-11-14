import { faker } from '@faker-js/faker/locale/af_ZA';
import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
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

test.describe('OC - Livechat API - Basic Widget Interactions', () => {
	// TODO: Check if there is a way to add livechat to the global window object

	// Tests that rely only on the widget itself, without requiring further interaction from the main RC app
	let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
	let poLiveChat: OmnichannelLiveChatEmbedded;
	let page: Page;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ browser, api }) => {
		agent = await createAgent(api, 'user1');

		page = await browser.newPage();

		poLiveChat = new OmnichannelLiveChatEmbedded(page, api);

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

			await expect(poLiveChat.btnOpenLiveChat).not.toBeVisible();
		});

		await test.step('Expect livechat button to be visible after show()', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.showWidget());

			await expect(poLiveChat.btnOpenLiveChat).toBeVisible();
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
