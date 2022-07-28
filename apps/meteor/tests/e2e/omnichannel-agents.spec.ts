import { test, expect } from './utils/test';
import { Auth, OmnichannelAgents } from './page-objects';

test.describe('Agents', () => {
	let pageAuth: Auth;
	let pageOmnichannelAgents: OmnichannelAgents;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageOmnichannelAgents = new OmnichannelAgents(page);
	});

	test.beforeEach(async ({ page }) => {
		await pageAuth.doLogin();
		await page.goto('/omnichannel');
		await pageOmnichannelAgents.agentsLink.click();
		await pageOmnichannelAgents.doAddAgent();
	});

	test('expect admin/manager is able to add an agent', async () => {
		await expect(pageOmnichannelAgents.agentAdded).toBeVisible();
		await expect(pageOmnichannelAgents.agentAdded).toHaveText('Rocket.Cat');
	});

	test('expect open new agent info on tab', async () => {
		await pageOmnichannelAgents.agentAdded.click();
		await expect(pageOmnichannelAgents.userInfoTab).toBeVisible();
		await expect(pageOmnichannelAgents.agentInfo).toBeVisible();
	});

	test('expect close agent info on tab', async () => {
		await pageOmnichannelAgents.agentAdded.click();
		await pageOmnichannelAgents.btnClose.click();
		await expect(pageOmnichannelAgents.userInfoTab).not.toBeVisible();
		await expect(pageOmnichannelAgents.agentInfo).not.toBeVisible();
		await pageOmnichannelAgents.agentAdded.click();
	});

	test.describe('Edit button', async () => {
		test.describe('Action', async () => {
			test('expect change user status', async () => {
				await pageOmnichannelAgents.doChangeUserStatus('not-available');
				await expect(pageOmnichannelAgents.agentListStatus).toHaveText('Not Available');
			});

			test.describe('Modal Actions', async () => {
				test.beforeEach(async () => {
					await pageOmnichannelAgents.doRemoveAgent();
				});

				test('expect modal is not visible after cancel delete agent', async () => {
					await pageOmnichannelAgents.btnModalCancel.click();
					await expect(pageOmnichannelAgents.modal).not.toBeVisible();
				});

				test('expect agent is removed from user info tab', async () => {
					await pageOmnichannelAgents.btnModalRemove.click();
					await expect(pageOmnichannelAgents.modal).not.toBeVisible();
					await expect(pageOmnichannelAgents.agentAdded).not.toBeVisible();
				});
			});

			test.describe('Remove from table', async () => {
				test.beforeEach(async () => {
					await pageOmnichannelAgents.doAddAgent();
				});

				test.beforeEach(async () => {
					await pageOmnichannelAgents.btnTableRemove.click();
				});

				test('expect modal is not visible after cancel delete agent', async () => {
					await pageOmnichannelAgents.btnModalCancel.click();
					await expect(pageOmnichannelAgents.modal).not.toBeVisible();
				});

				test('expect agent is removed from agents table', async () => {
					await pageOmnichannelAgents.btnModalRemove.click();
					await expect(pageOmnichannelAgents.modal).not.toBeVisible();
					await expect(pageOmnichannelAgents.agentAdded).not.toBeVisible();
				});
			});
		});
	});
});
