import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { expect, test } from '../utils/test';

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

test.describe('Widget Listeners', () => {
	// Tests that listen to events from the widget, and check if they are being triggered

	let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
	let poLiveChat: OmnichannelLiveChatEmbedded;
	let page: Page;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');
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
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteClosedRooms(api), agent.delete(), setSettingValueById(api, 'Livechat_offline_email', '')]);
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
		const visitor = createFakeVisitor();

		await test.step('Expect onChatStarted to trigger callback', async () => {
			const watchForTrigger = page.waitForFunction(() => window.onChatStarted === true);

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onChatStarted(() => {
					window.onChatStarted = true;
				}),
			);

			await poLiveChat.startChat({ visitor });

			await watchForTrigger;
		});

		await test.step('Expect onChatEnded to trigger callback', async () => {
			const watchForTrigger = page.waitForFunction(() => window.onChatEnded === true);

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onChatEnded(() => {
					window.onChatEnded = true;
				}),
			);

			await poAuxContext.poHomeOmnichannel.sidenav.openChat(visitor.name);
			await poAuxContext.poHomeOmnichannel.content.closeChat();
			await expect(poAuxContext.poHomeOmnichannel.toastSuccess).toBeVisible();

			await watchForTrigger;
		});
	});

	test('OC - Livechat API - onPrechatFormSubmit & onAssignAgent', async () => {
		const visitor = createFakeVisitor();

		await test.step('Expect onPrechatFormSubmit to trigger callback', async () => {
			const watchForTrigger = page.waitForFunction(() => window.onPrechatFormSubmit === true);

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onPrechatFormSubmit(() => {
					window.onPrechatFormSubmit = true;
				}),
			);

			await poLiveChat.btnOpenLiveChat.click();
			await poLiveChat.registerVisitor(visitor);

			await watchForTrigger;
		});

		await test.step('Expect onAssignAgent to trigger callback', async () => {
			const watchForTrigger = page.waitForFunction(() => window.onAssignAgent === true);

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onAssignAgent(() => {
					window.onAssignAgent = true;
				}),
			);

			await poLiveChat.sendMessage('some_message');

			await watchForTrigger;
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});

	// TODO: Fix this Flaky test
	test.skip('onAgentStatusChange', async () => {
		const visitor = createFakeVisitor();

		await poLiveChat.startChat({ visitor });

		const watchForTrigger = page.waitForFunction(() => window.onAgentStatusChange === true);

		await poLiveChat.page.evaluate(() =>
			window.RocketChat.livechat.onAgentStatusChange(() => {
				window.onAgentStatusChange = true;
			}),
		);

		await poAuxContext.poHomeOmnichannel.sidenav.openChat(visitor.name);
		await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');

		await watchForTrigger;

		await poLiveChat.closeChat();
	});

	test.skip('OC - Livechat API - onOfflineFormSubmit', async () => {
		const newVisitor = createFakeVisitor();

		await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');

		const watchForTrigger = page.waitForFunction(() => window.onOfflineFormSubmit === true);

		await poLiveChat.page.reload();

		await poLiveChat.page.evaluate(() =>
			window.RocketChat.livechat.onOfflineFormSubmit(() => {
				window.onOfflineFormSubmit = true;
			}),
		);

		await poLiveChat.btnOpenLiveChat.click();
		await poLiveChat.registerVisitor(newVisitor, true);

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
