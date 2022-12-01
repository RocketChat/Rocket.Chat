import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat } from './page-objects';
import { OmnichannelTriggers } from './page-objects/omnichannel-triggers';
import { OmnichannelSidenav } from './page-objects/fragments/omnichannel-sidenav';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-triggers', () => {
	let poOmnichannelTriggers: OmnichannelTriggers;
	let poOmnichannelSidenav: OmnichannelSidenav;
	let triggersName: string;
	let triggerMessage: string;
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	test.beforeAll(() => {
		triggersName = faker.datatype.uuid();
		triggerMessage = 'Welcome to Rocket.chat';
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelTriggers = new OmnichannelTriggers(page);
		poOmnichannelSidenav = new OmnichannelSidenav(page);
		await page.goto('/omnichannel');
		await poOmnichannelSidenav.linkTriggers.click();
		await expect(page.url()).toContain('/omnichannel/triggers');
	});

	test('expect create new trigger', async () => {
		await poOmnichannelTriggers.btnNew.click();
		await poOmnichannelTriggers.Name.fill(triggersName);
		await poOmnichannelTriggers.Description.fill('Creating a fresh trigger');
		await poOmnichannelTriggers.visitorPageURL.click();
		await poOmnichannelTriggers.visitorTimeOnSite.click();
		await poOmnichannelTriggers.addTime.click();
		await poOmnichannelTriggers.addTime.fill('5s');
		await poOmnichannelTriggers.impersonateAgent.click();
		await poOmnichannelTriggers.textArea.fill(triggerMessage);
		await poOmnichannelTriggers.saveBtn.click();

		await expect(poOmnichannelTriggers.toastMessage).toBeVisible();
	});

	test('expect update trigger name', async ({}) => {
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
		await poOmnichannelTriggers.firstRowInTable.click();
		await poOmnichannelTriggers.Name.fill(triggersName);
		await poOmnichannelTriggers.Description.fill('Updating the existing trigger');
		await poOmnichannelTriggers.visitorTimeOnSite.click();
		await poOmnichannelTriggers.chatOpenedByVisitor.click();
		await poOmnichannelTriggers.impersonateAgent.click();
		await poOmnichannelTriggers.customAgent.click();
		await poOmnichannelTriggers.agentName.fill('Rocket.cat');
		await poOmnichannelTriggers.textArea.fill(triggerMessage);
		await poOmnichannelTriggers.saveBtn.click();

		await expect(poOmnichannelTriggers.toastMessage).toBeVisible();

		// start a new chat to verify trigger is fired on
		poLiveChat = new OmnichannelLiveChat(page);
		await page.goto('/livechat');
		await poLiveChat.btnOpenLiveChat('R').click();
		await poLiveChat.sendMessage(newVisitor, false);
		await expect(poLiveChat.firstAutoMessage).toHaveText(triggerMessage);
	});

	test('expect deleting trigger', async ({}) => {
		await poOmnichannelTriggers.btnDeletefirstRowInTable.click();
		await poOmnichannelTriggers.btnModalRemove.click();

		await expect(poOmnichannelTriggers.removeToastMessage).toBeVisible();
	});
});
