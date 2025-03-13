import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { setSettingValueById, setUserPreferences } from '../utils';
import { test, expect } from '../utils/test';

const firstVisitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Livechat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;
	const newRoomNotification = 'door';

	test.beforeAll(async ({ api }) => {
		expect((await api.post('/livechat/users/agent', { username: 'user1' })).status()).toBe(200);
	});

	test.beforeAll(async ({ api }) => {
		expect((await setUserPreferences(api, { newRoomNotification })).status()).toBe(200);
		expect((await setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection')).status()).toBe(200);
		expect((await setSettingValueById(api, 'Livechat_continuous_sound_notification_new_livechat_room', true)).status()).toBe(200);
	});

	test.beforeAll(async ({ browser, api }) => {
		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);

		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeOmnichannel = new HomeOmnichannel(page);

		await page.goto('/');
		await page.locator('.main-content').waitFor();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		expect((await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection')).status()).toBe(200);
		expect((await setSettingValueById(api, 'Livechat_continuous_sound_notification_new_livechat_room', false)).status()).toBe(200);
		await poLiveChat.page.close();
	});

	test('OC - Livechat - Continuous sound notification', async ({ page }) => {
		const audioCustomSoundId = `#custom-sound-${newRoomNotification}-continuous`;

		await test.step('expect message to be sent by livechat', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(firstVisitor, false);

			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect continuous sound notification to start playing once message is received', async () => {
			await expect(poHomeOmnichannel.sidenav.getSidebarItemByName(firstVisitor.name)).toBeVisible();
			const audioElement = page.locator(audioCustomSoundId);
			await expect(audioElement).toBeAttached();
			await expect(audioElement).toHaveJSProperty('paused', false);
			await expect(audioElement).toHaveJSProperty('loop', true);
		});

		await test.step('expect agent to take the chat', async () => {
			await poHomeOmnichannel.sidenav.getSidebarItemByName(firstVisitor.name).click();
			await expect(poHomeOmnichannel.content.btnTakeChat).toBeVisible();
			await poHomeOmnichannel.content.btnTakeChat.click();
		});

		await test.step('expect continuous sound notification to stop playing once room is taken', async () => {
			await expect(poHomeOmnichannel.sidenav.getSidebarItemByName(firstVisitor.name)).toBeVisible();
			const audioElement = page.locator(audioCustomSoundId);
			await expect(audioElement).toBeAttached();
			await expect(audioElement).toHaveJSProperty('paused', true);
		});

		await test.step('expect conversation to be closed by agent', async () => {
			await poHomeOmnichannel.content.btnCloseChat.click();
			await poHomeOmnichannel.content.closeChatModal.inputComment.fill('this_is_a_test_comment');
			await poHomeOmnichannel.content.closeChatModal.btnConfirm.click();
		});
	});
});
