import { test, expect, Page } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { LoginPage, SideNav, Agents, Global } from './pageobjects';

test.describe('[Agents]', () => {
	let loginPage: LoginPage;
	let page: Page;
	let sideNav: SideNav;
	let agents: Agents;
	let global: Global;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		const rootPath = '/';
		await page.goto(rootPath);
		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);
		agents = new Agents(page);
		global = new Global(page);

		await loginPage.login(adminLogin);
		await sideNav.sidebarUserMenu.click();
		await sideNav.omnichannel.click();
		await agents.agentsLink.click();
		await agents.doAddAgent();
	});

	test('expect admin/manager is able to add an agent', async () => {
		await expect(agents.agentAdded).toBeVisible();
		await expect(agents.agentAdded).toHaveText('Rocket.Cat');
	});
	test('expect open new agent info on tab', async () => {
		await agents.agentAdded.click();
		await expect(agents.userInfoTab).toBeVisible();
		await expect(agents.agentInfo).toBeVisible();
	});
	test('expect close agent info on tab', async () => {
		await agents.btnClose.click();
		await expect(agents.userInfoTab).not.toBeVisible();
		await expect(agents.agentInfo).not.toBeVisible();
		await agents.agentAdded.click();
	});

	test.describe('[Render]', () => {
		test('expect show profile image', async () => {
			await expect(agents.userAvatar).toBeVisible();
		});
		test('expect show action buttons', async () => {
			await expect(agents.btnClose).toBeVisible();
			await expect(agents.btnEdit).toBeVisible();
			await expect(agents.btnRemove).toBeVisible();
		});

		test('expect show livechat status', async () => {
			await expect(agents.agentInfoUserInfoLabel).toBeVisible();
		});
	});
	test.describe('[Edit button]', async () => {
		test.describe('[Render]', async () => {
			test.beforeAll(async () => {
				await agents.btnEdit.click();
			});
			test('expect show fields', async () => {
				await agents.getListOfExpectedInputs();
			});
		});

		test.describe('[Action]', async () => {
			test('expect change user status', async () => {
				await agents.doChangeUserStatus('not-available');
				await expect(agents.agentListStatus).toHaveText('Not Available');
			});
			test.describe('[Modal Actions]', async () => {
				test.beforeEach(async () => {
					await agents.doRemoveAgent();
				});
				test('expect modal is not visible after cancel delete agent', async () => {
					await global.btnModalCancel.click();
					await expect(global.modal).not.toBeVisible();
				});
				test('expect agent is removed from user info tab', async () => {
					await global.btnModalRemove.click();
					await expect(global.modal).not.toBeVisible();
					await expect(agents.agentAdded).not.toBeVisible();
				});
			});

			test.describe('[Remove from table]', async () => {
				test.beforeAll(async () => {
					await agents.doAddAgent();
				});
				test.beforeEach(async () => {
					await agents.btnTableRemove.click();
				});
				test('expect modal is not visible after cancel delete agent', async () => {
					await global.btnModalCancel.click();
					await expect(global.modal).not.toBeVisible();
				});
				test('expect agent is removed from agents table', async () => {
					await global.btnModalRemove.click();
					await expect(global.modal).not.toBeVisible();
					await expect(agents.agentAdded).not.toBeVisible();
				});
			});
		});
	});
});
