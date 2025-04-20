import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { AccountProfile, HomeChannel } from './page-objects';
import {
	createTargetChannel,
	createTargetTeam,
	deleteChannel,
	deleteTeam,
	setSettingValueById,
	createTargetDiscussion,
	createChannelWithTeam,
	deleteRoom,
} from './utils';
import { setUserPreferences } from './utils/setUserPreferences';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('feature preview', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;
	let targetChannel: string;
	let targetDiscussion: Record<string, string>;
	let sidepanelTeam: string;
	const targetChannelNameInTeam = `channel-from-team-${faker.number.int()}`;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		targetDiscussion = await createTargetDiscussion(api);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', false);
		await deleteChannel(api, targetChannel);
		await deleteRoom(api, targetDiscussion._id);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);
	});

	test('should show "Message" and "Navigation" feature sections', async ({ page }) => {
		await page.goto('/account/feature-preview');

		await expect(page.getByRole('button', { name: 'Message' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Navigation' })).toBeVisible();
	});

	test.describe('Enhanced navigation', () => {
		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: true,
					},
				],
			});
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: false,
					},
				],
			});
		});

		// After moving `Enhanced navigation` out of feature preview, move these tests to sidebar.spec.ts
		test('should be able to toggle "Enhanced navigation" feature', async ({ page }) => {
			await page.goto('/account/feature-preview');

			await poAccountProfile.getAccordionItemByName('Navigation').click();
			const newNavigationCheckbox = poAccountProfile.getCheckboxByLabelText('Enhanced navigation');
			await expect(newNavigationCheckbox).toBeChecked();
			await newNavigationCheckbox.click();
			await expect(newNavigationCheckbox).not.toBeChecked();
		});

		test('should be rendering new UI with "Enhanced navigation"', async ({ page }) => {
			await page.goto('/account/feature-preview');

			await expect(poHomeChannel.navbar.navbar).toBeVisible();
		});

		test('should render global header navigation', async ({ page }) => {
			await page.goto('/home');

			await test.step('should display recent chats when navbar search is clicked', async () => {
				await poHomeChannel.navbar.searchInput.click();
				await expect(poHomeChannel.navbar.searchList).toBeVisible();
				await poHomeChannel.navbar.searchInput.blur();
			});

			await test.step('should display home and directory button', async () => {
				await expect(poHomeChannel.navbar.homeButton).toBeVisible();
				await expect(poHomeChannel.navbar.btnDirectory).toBeVisible();
			});

			await test.step('should display home and directory inside a menu and sidebar toggler in tablet view', async () => {
				await page.setViewportSize({ width: 1023, height: 767 });
				await expect(poHomeChannel.navbar.btnMenuPages).toBeVisible();
				await expect(poHomeChannel.navbar.btnSidebarToggler).toBeVisible();
			});

			await test.step('should display voice and omnichannel items inside a menu in mobile view', async () => {
				await page.setViewportSize({ width: 767, height: 510 });
				await expect(poHomeChannel.navbar.btnVoiceAndOmnichannel).toBeVisible();
			});

			await test.step('should hide everything else when navbar search is focused in mobile view', async () => {
				await page.setViewportSize({ width: 767, height: 510 });
				await poHomeChannel.navbar.searchInput.click();

				await expect(poHomeChannel.navbar.btnMenuPages).not.toBeVisible();
				await expect(poHomeChannel.navbar.btnSidebarToggler).not.toBeVisible();
				await expect(poHomeChannel.navbar.btnVoiceAndOmnichannel).not.toBeVisible();
				await expect(poHomeChannel.navbar.groupHistoryNavigation).not.toBeVisible();
			});
		});

		test('should not display room topic in direct message', async ({ page }) => {
			await page.goto('/direct/user2');

			// Not creating a PO because this will be removed very soon
			await expect(page.locator('main').getByRole('note')).not.toBeVisible();
		});

		test('should expand/collapse sidebar groups', async ({ page }) => {
			await page.goto('/home');
			const collapser = poHomeChannel.sidebar.firstCollapser;
			let isExpanded: boolean;

			await collapser.click();
			isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
			expect(isExpanded).toBeFalsy();

			await collapser.click();
			isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
			expect(isExpanded).toBeTruthy();
		});

		test('should expand/collapse sidebar groups with keyboard', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser;

			await expect(async () => {
				await collapser.focus();
				await expect(collapser).toBeFocused();
				await page.keyboard.press('Enter');
				const isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
				expect(isExpanded).toBeFalsy();
			}).toPass();

			await expect(async () => {
				await collapser.focus();
				await page.keyboard.press('Space');
				const isExpanded = (await collapser.getAttribute('aria-expanded')) === 'true';
				expect(isExpanded).toBeTruthy();
			}).toPass();
		});

		test('should be able to use keyboard to navigate through sidebar items', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser;
			const dataIndex = await collapser.locator('../..').getAttribute('data-index');
			const nextItem = page.locator(`[data-index="${Number(dataIndex) + 1}"]`).getByRole('link');

			await expect(async () => {
				await collapser.focus();
				await page.keyboard.press('ArrowDown');
				await expect(nextItem).toBeFocused();
			}).toPass();
		});

		test('should persist collapsed/expanded groups after page reload', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser;
			await collapser.click();
			const isExpanded = await collapser.getAttribute('aria-expanded');

			await page.reload();

			const isExpandedAfterReload = await collapser.getAttribute('aria-expanded');
			expect(isExpanded).toEqual(isExpandedAfterReload);
		});

		test('should show unread badge on collapser when group is collapsed and has unread items', async ({ page }) => {
			await page.goto('/home');

			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('hello world');

			const item = poHomeChannel.sidebar.getSearchRoomByName(targetChannel);
			await poHomeChannel.sidebar.markItemAsUnread(item);
			await poHomeChannel.sidebar.escSearch();

			const collapser = poHomeChannel.sidebar.getCollapseGroupByName('Channels');
			await collapser.click();
			await expect(poHomeChannel.sidebar.getItemUnreadBadge(collapser)).toBeVisible();
		});

		test('should not show NavBar in embedded layout', async ({ page }) => {
			await page.goto('/home');

			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(page.locator('role=navigation[name="header"]')).toBeVisible();
			const embeddedLayoutURL = `${page.url()}?layout=embedded`;
			await page.goto(embeddedLayoutURL);
			await expect(page.locator('role=navigation[name="header"]')).not.toBeVisible();
		});

		test('should display the room header properly', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.navbar.openChat(targetDiscussion.fname);

			await test.step('should not display avatar in room header', async () => {
				await expect(page.locator('main').locator('header').getByRole('figure')).not.toBeVisible();
			});

			await test.step('should display the back button in the room header when accessing a room with parent', async () => {
				await expect(
					page
						.locator('main')
						.locator('header')
						.getByRole('button', { name: /Back to/ }),
				).toBeVisible();
			});
		});

		test.describe('user is not part of the team', () => {
			let targetTeam: string;
			let targetChannelWithTeam: string;
			let user1Page: Page;

			test.beforeAll(async ({ api, browser }) => {
				await setSettingValueById(api, 'Accounts_Default_User_Preferences_featuresPreview', [{ name: 'newNavigation', value: true }]);

				const { channelName, teamName } = await createChannelWithTeam(api);
				targetTeam = teamName;
				targetChannelWithTeam = channelName;
				user1Page = await browser.newPage({ storageState: Users.user1.state });
			});

			test.afterAll(async ({ api }) => {
				await setSettingValueById(api, 'Accounts_Default_User_Preferences_featuresPreview', []);

				await deleteChannel(api, targetChannelWithTeam);
				await deleteTeam(api, targetTeam);
				await user1Page.close();
			});

			test('should not display back to team button in the room header', async ({ page }) => {
				await user1Page.goto(`/channel/${targetChannelWithTeam}`);

				await expect(
					page
						.locator('main')
						.locator('header')
						.getByRole('button', { name: /Back to/ }),
				).not.toBeVisible();
			});
		});
	});

	test.describe('Sidepanel', () => {
		test.beforeEach(async ({ api }) => {
			sidepanelTeam = await createTargetTeam(api, { sidepanel: { items: ['channels', 'discussions'] } });

			await setUserPreferences(api, {
				sidebarViewMode: 'Medium',
				featuresPreview: [
					{
						name: 'newNavigation',
						value: true,
					},
					{
						name: 'sidepanelNavigation',
						value: true,
					},
				],
			});
		});

		test.afterEach(async ({ api }) => {
			await deleteTeam(api, sidepanelTeam);

			await setUserPreferences(api, {
				sidebarViewMode: 'Medium',
				featuresPreview: [
					{
						name: 'newNavigation',
						value: false,
					},
					{
						name: 'sidepanelNavigation',
						value: false,
					},
				],
			});
		});
		test('should be able to toggle "Sidepanel" feature', async ({ page }) => {
			await page.goto('/account/feature-preview');

			await poAccountProfile.getAccordionItemByName('Navigation').click();
			const sidepanelCheckbox = poAccountProfile.getCheckboxByLabelText('Secondary navigation for teams');
			await expect(sidepanelCheckbox).toBeChecked();
			await sidepanelCheckbox.click();
			await expect(sidepanelCheckbox).not.toBeChecked();

			await poAccountProfile.btnSaveChanges.click();

			await expect(poAccountProfile.btnSaveChanges).not.toBeVisible();
			await expect(sidepanelCheckbox).not.toBeChecked();
		});

		test('should display sidepanel on a team and hide it on edit', async ({ page }) => {
			await page.goto(`/group/${sidepanelTeam}`);
			await poHomeChannel.content.waitForChannel();
			await expect(poHomeChannel.sidepanel.sidepanelList).toBeVisible();

			await poHomeChannel.tabs.btnRoomInfo.click();
			await poHomeChannel.tabs.room.btnEdit.click();
			await poHomeChannel.tabs.room.advancedSettingsAccordion.click();
			await poHomeChannel.tabs.room.toggleSidepanelItems();
			await poHomeChannel.tabs.room.btnSave.click();

			await expect(poHomeChannel.sidepanel.sidepanelList).not.toBeVisible();
		});

		test('should display new channel from team on the sidepanel', async ({ page, api }) => {
			await page.goto(`/group/${sidepanelTeam}`);
			await poHomeChannel.content.waitForChannel();

			await poHomeChannel.tabs.btnChannels.click();
			await poHomeChannel.tabs.channels.btnCreateNew.click();
			await poHomeChannel.sidenav.inputChannelName.fill(targetChannelNameInTeam);
			await poHomeChannel.sidenav.checkboxPrivateChannel.click();
			await poHomeChannel.sidenav.btnCreate.click();

			await expect(poHomeChannel.sidepanel.sidepanelList).toBeVisible();
			await expect(poHomeChannel.sidepanel.getItemByName(targetChannelNameInTeam)).toBeVisible();

			await deleteChannel(api, targetChannelNameInTeam);
		});

		test('should display sidepanel item with the same display preference as the sidebar', async ({ page }) => {
			await page.goto('/home');
			const message = 'hello world';

			await poHomeChannel.navbar.setDisplayMode('Extended');
			await poHomeChannel.navbar.openChat(sidepanelTeam);
			await poHomeChannel.content.sendMessage(message);
			await expect(poHomeChannel.sidepanel.getExtendedItem(sidepanelTeam, message)).toBeVisible();
		});

		test('should escape special characters on item subtitle', async ({ page }) => {
			await page.goto('/home');
			const message = 'hello > world';
			const parsedWrong = 'hello &gt; world';

			await poHomeChannel.navbar.setDisplayMode('Extended');
			await poHomeChannel.navbar.openChat(sidepanelTeam);
			await poHomeChannel.content.sendMessage(message);

			await expect(poHomeChannel.sidepanel.getExtendedItem(sidepanelTeam, message)).toBeVisible();
			await expect(poHomeChannel.sidepanel.getExtendedItem(sidepanelTeam, message)).not.toHaveText(parsedWrong);
		});

		test('should show channel in sidepanel after adding existing one', async ({ page }) => {
			await page.goto(`/group/${sidepanelTeam}`);

			await poHomeChannel.tabs.btnChannels.click();
			await poHomeChannel.tabs.channels.btnAddExisting.click();
			// flaky: workarround for when AutoComplete does not close the list box before trying to click `Add`
			await expect(async () => {
				await poHomeChannel.tabs.channels.inputChannels.fill(targetChannel);
				const option = poHomeChannel.tabs.channels.getListboxOption(targetChannel);
				await option.click();
				await expect(option).not.toBeVisible();
			}).toPass();

			await poHomeChannel.tabs.channels.btnAdd.click();
			await poHomeChannel.content.waitForChannel();

			await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).toBeVisible();
		});

		test('should sort by last message even if unread message is inside thread', async ({ page, browser }) => {
			const user1Page = await browser.newPage({ storageState: Users.user1.state });
			const user1Channel = new HomeChannel(user1Page);

			await page.goto(`/group/${sidepanelTeam}`);

			await poHomeChannel.tabs.btnChannels.click();
			await poHomeChannel.tabs.channels.btnAddExisting.click();
			// flaky: workarround for when AutoComplete does not close the list box before trying to click `Add`
			await expect(async () => {
				await poHomeChannel.tabs.channels.inputChannels.fill(targetChannel);
				const option = poHomeChannel.tabs.channels.getListboxOption(targetChannel);
				await option.click();
				await expect(option).not.toBeVisible();
			}).toPass();
			await poHomeChannel.tabs.channels.btnAdd.click();

			const sidepanelTeamItem = poHomeChannel.sidepanel.getItemByName(sidepanelTeam);
			const targetChannelItem = poHomeChannel.sidepanel.getItemByName(targetChannel);

			await targetChannelItem.click();
			expect(page.url()).toContain(`/channel/${targetChannel}`);
			await poHomeChannel.content.sendMessage('hello channel');

			await expect(async () => {
				await sidepanelTeamItem.focus();
				await sidepanelTeamItem.click();
				expect(page.url()).toContain(`/group/${sidepanelTeam}`);
			}).toPass();
			await poHomeChannel.content.sendMessage('hello team');

			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await user1Channel.content.openReplyInThread();
			await user1Channel.content.toggleAlsoSendThreadToChannel(false);
			await user1Channel.content.sendMessageInThread('hello thread');

			const item = poHomeChannel.sidepanel.getItemByName(targetChannel);
			await expect(item.locator('..')).toHaveAttribute('data-item-index', '0');

			await user1Page.close();
		});
	});
});
