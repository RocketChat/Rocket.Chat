import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { test, expect } from '../utils/test';
import { faker } from '@faker-js/faker';

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

test.describe('Omnichannel - Livechat API', () => {
	// TODO: Check if there is a way to add livechat to the global window object 
	
	test.describe('Basic Widget Interactions', () => {
		// Tests that rely only on the widget itself, without requiring further interaction from the main RC app
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChatEmbedded;
		let page: Page;

		test.beforeAll(async ({ browser, api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			await expect(statusCode).toBe(200);

			page = await browser.newPage();
			await expect((await api.post('/settings/Enable_CSP', { value: false })).status()).toBe(200);

			poLiveChat = new OmnichannelLiveChatEmbedded(page, api);

			const { page: pageCtx } = await createAuxContext(browser, Users.user1);
			poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async ({ api }) => {
			// await expect((await api.post('/settings/Enable_CSP', { value: true })).status()).toBe(200);
			await api.delete('/livechat/users/agent/user1');
			await poAuxContext.page.close();
			await page.close();
		});

		test('Open and Close widget', async () => {
			await test.step('Expect widget to be visible after maximizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).toBeVisible();
			});

			await test.step('Expect widget not be visible after minimizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.minimizeWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByText('Start Chat')).not.toBeVisible();
			});
		});

		test('Show and Hide widget', async () => {
			await test.step('Expect livechat button not be visible after minimizeWidget()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.hideWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByRole('button', { name: 'Rocket.Chat' })).not.toBeVisible();
			});

			await test.step('Expect livechat button to be visible after show()', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.showWidget());

				await expect(page.frameLocator('#rocketchat-iframe').getByRole('button', { name: 'Rocket.Chat' })).toBeVisible();
			});
		});

		test.skip('setAgent', async () => {
			// Set agent does not actually set the agent, it just sets the default agent on the widget state
			// Maybe that is used in an integration? Since as it is now, when the user starts a chat, the agent will be overriden
			// TODO: Find the use case of the setAgent method
			await test.step('Expect setAgent to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setAgent({ username: 'user1', _id: 'user1' }));
			});
		});

		test('setLanguage', async () => {
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

		test.skip('setTheme', async () => {
			// TODO: check what are all of the possibilities of themes (colors, fonts, texts, etc...)
			await test.step('Expect setTheme to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setTheme({}));
			});
		});

		test.skip('setParentUrl', async () => {
			// TODO: check how to test this, not sure there is a clear indication of parent url changes
			await test.step('Expect setParentUrl to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setParentUrl('http://localhost:3000'));
			});
		});
	});

	test.describe('Complex Widget Interactions', () => {
		// Tests that requires interaction from an agent or more
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChatEmbedded;
		let page: Page;

		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			await expect(statusCode).toBe(200);
			await expect((await api.post('/settings/Enable_CSP', { value: false })).status()).toBe(200);
			await expect((await api.post('/settings/Livechat_offline_email', { value: 'test@testing.com' })).status()).toBe(200);
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
			// await expect((await api.post('/settings/Enable_CSP', { value: true })).status()).toBe(200);
			await api.delete('/livechat/users/agent/user1');
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

		test.skip('clearBusinessUnit', async () => {
			// TODO
			await test.step('Expect clearBusinessUnit to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.clearBusinessUnit());
			});
		});

		test.skip('clearDepartment', async () => {
			// TODO
			await test.step('Expect clearDepartment to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.clearDepartment());
			});
		});

		test.skip('registerGuest', async () => {
			// TODO
			await test.step('Expect registerGuest to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.registerGuest());
			});
		});

		test.skip('setBusinessUnit', async () => {
			// TODO
			await test.step('Expect setBusinessUnit to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setBusinessUnit());
			});
		});

		test.skip('setCustomField', async () => {
			// TODO
			await test.step('Expect setCustomField to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setCustomField());
			});
		});

		test.skip('setGuestEmail', async () => {
			// TODO
			await test.step('Expect setGuestEmail to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setGuestEmail());
			});
		});

		test.skip('setGuestName', async () => {
			// TODO
			await test.step('Expect setGuestName to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setGuestName());
			});
		});

		test.skip('setGuestToken', async () => {
			// TODO
			await test.step('Expect setGuestToken to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setGuestToken());
			});
		});
	});

	test.describe('Widget Listeners', () => {
		// Tests that listen to events from the widget, and check if they are being triggered
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChatEmbedded;
		let page: Page;

		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			await expect(statusCode).toBe(200);
			await expect((await api.post('/settings/Enable_CSP', { value: false })).status()).toBe(200);
			await expect((await api.post('/settings/Livechat_offline_email', { value: 'test@testing.com' })).status()).toBe(200);
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
			// await expect((await api.post('/settings/Enable_CSP', { value: true })).status()).toBe(200);
			await api.delete('/livechat/users/agent/user1');
		});

		test('onChatMaximized & onChatMinimized', async () => {
			await test.step('Expect onChatMaximized to trigger callback', async () => {
				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onChatMaximized(() => {
						window.onChatMaximized = true;
					}),
				);

				const watchForTrigger = page.waitForFunction(() => window.onChatMaximized === true);

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.maximizeWidget());

				await watchForTrigger;
			});

			await test.step('Expect onChatMinimized to trigger callback', async () => {
				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onChatMinimized(() => {
						window.onChatMinimized = true;
					}),
				);

				const watchForTrigger = page.waitForFunction(() => window.onChatMinimized === true);

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.minimizeWidget());

				await watchForTrigger;
			});
		});

		test('onChatStarted & onChatEnded', async () => {
			const newVisitor = {
				name: faker.person.firstName(),
				email: faker.internet.email(),
			};
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
				await poAuxContext.poHomeOmnichannel.content.omnichannelCloseChatModal.inputComment.fill('this_is_a_test_comment');
				await poAuxContext.poHomeOmnichannel.content.omnichannelCloseChatModal.btnConfirm.click();
				await expect(poAuxContext.poHomeOmnichannel.toastSuccess).toBeVisible();

				await watchForTrigger;
			});
		});

		test('onPrechatFormSubmit, onAssignAgent & onAgentStatusChange', async () => {
			const newVisitor = {
				name: faker.person.firstName(),
				email: faker.internet.email(),
			};

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

			await test.step('onAgentStatusChange', async () => {
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
		});

		test('Expect onOfflineFormSubmit to trigger callback', async () => {
			const newVisitor = {
				name: faker.person.firstName(),
				email: faker.internet.email(),
			};

			await poAuxContext.poHomeOmnichannel.sidenav.switchStatus('offline');

			const watchForTrigger = page.waitForFunction(() => window.onOfflineFormSubmit === true);

			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.onOfflineFormSubmit(() => {
					window.onOfflineFormSubmit = true;
				}),
			);

			await poLiveChat.openLiveChat(true);
			await poLiveChat.sendMessage(newVisitor, true);

			await watchForTrigger;
		});

		test('onWidgetHidden & onWidgetShown', async () => {
			await test.step('Expect onWidgetHidden to trigger callback', async () => {
				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onWidgetHidden(() => {
						window.onWidgetHidden = true;
					}),
				);

				const watchForTrigger = page.waitForFunction(() => window.onWidgetHidden === true);

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.hideWidget());

				await watchForTrigger;
			});

			await test.step('Expect onWidgetShown to trigger callback', async () => {
				await poLiveChat.page.evaluate(() =>
					window.RocketChat.livechat.onWidgetShown(() => {
						window.onWidgetShown = true;
					}),
				);

				const watchForTrigger = page.waitForFunction(() => window.onWidgetShown === true);

				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.showWidget());

				await watchForTrigger;
			});
		});

		test.skip('onServiceOffline', async () => {
			// TODO: Not sure how to test this, need to check if playwright has a way to mock a server disconnect
			await test.step('Expect onServiceOffline to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.onServiceOffline(() => console.log('onServiceOffline')));
			});
		});

		test.skip('onQueuePositionChange', async () => {
			// TODO
			await test.step('Expect onQueuePositionChange to do something', async () => {
				await poLiveChat.page.evaluate(() => window.RocketChat.livechat.onQueuePositionChange(() => console.log('onQueuePositionChange')));
			});
		});
	});
	
});
