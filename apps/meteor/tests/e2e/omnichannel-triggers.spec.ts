import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat } from './page-objects';
import { OmnichannelTriggers } from './page-objects/omnichannel-triggers';
import { OmnichannelSidenav } from './page-objects/fragments/omnichannel-sidenav';

test.use({ storageState: 'user1-session.json' });

test.describe.serial('omnichannel-triggers', () => {
	let poOmnichannelTriggers: OmnichannelTriggers;
	let poOmnichannelSidenav: OmnichannelSidenav;
	let triggersName: string;
	let triggerMessage: string;
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	test.beforeAll(async ({ api }) => {
		triggersName = faker.datatype.uuid();
		triggerMessage = 'Welcome to Rocket.chat';
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannelTriggers = new OmnichannelTriggers(page);
		poOmnichannelSidenav = new OmnichannelSidenav(page);
		await page.goto('/omnichannel');
		await poOmnichannelSidenav.linkTriggers.click();
		expect(page.url()).toContain('/omnichannel/triggers');
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
	});

	test('expect create new trigger', async () => {
		await poOmnichannelTriggers.createTrigger(triggersName, triggerMessage);
		await expect(poOmnichannelTriggers.toastMessage).toBeVisible();
	});

	test('expect update trigger name', async () => {
		const newTriggerName = `edited-${triggersName}`;
		await poOmnichannelTriggers.firstRowInTable.click();
		await poOmnichannelTriggers.Name.fill(newTriggerName);
		await poOmnichannelTriggers.saveBtn.click();
		await expect(poOmnichannelTriggers.toastMessage).toBeVisible();
	});

	test('expect update trigger type', async ({ page }) => {
		newVisitor = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};
		await poOmnichannelTriggers.updateTrigger();
		await expect(poOmnichannelTriggers.toastMessage).toBeVisible();
		// start a new chat to verify trigger is fired on livechat
		poLiveChat = new OmnichannelLiveChat(page);
		await page.goto('/livechat');
		await poLiveChat.btnOpenLiveChat('R').click();
		await poLiveChat.sendMessage(newVisitor, false);
		await expect(poLiveChat.firstAutoMessage).toHaveText(triggerMessage);
	});

	test('expect deleting trigger', async () => {
		await poOmnichannelTriggers.btnDeletefirstRowInTable.click();
		await poOmnichannelTriggers.btnModalRemove.click();

		await expect(poOmnichannelTriggers.removeToastMessage).toBeVisible();
	});
});
