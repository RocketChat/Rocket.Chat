import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { AccountProfile, Admin, HomeChannel } from './page-objects';
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
		// await setSettingValueById(api, 'Accounts_AllowFeaturePreview', false);
		await deleteChannel(api, targetChannel);
		await deleteRoom(api, targetDiscussion._id);
		await setUserPreferences(api, {
			featuresPreview: [
				{
					name: 'newNavigation',
					value: false,
				},
			],
		});
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);
	});

	test('should show "Message" and "Navigation" feature sections', async ({ page }) => {
		await page.goto('/account/feature-preview');
		await page.waitForSelector('#main-content');

		await expect(page.getByRole('main').getByRole('button', { name: 'Message' })).toBeVisible();
		await expect(page.getByRole('main').getByRole('button', { name: 'Navigation' })).toBeVisible();
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
				await expect(poHomeChannel.navbar.btnSidebarToggler()).toBeVisible();
			});

			await test.step('should display voice and omnichannel items inside a menu in mobile view', async () => {
				await page.setViewportSize({ width: 767, height: 510 });
				await expect(poHomeChannel.navbar.btnVoiceAndOmnichannel).toBeVisible();
			});

			await test.step('should hide everything else when navbar search is focused in mobile view', async () => {
				await page.setViewportSize({ width: 767, height: 510 });
				await poHomeChannel.navbar.searchInput.click();

				await expect(poHomeChannel.navbar.btnMenuPages).not.toBeVisible();
				await expect(poHomeChannel.navbar.btnSidebarToggler()).not.toBeVisible();
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

			const collapser = poHomeChannel.sidebar.firstCollapser.getByRole('button');
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

			const collapser = poHomeChannel.sidebar.firstCollapser.getByRole('button');

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

		// TODO: fix, currently doesn't work due to grouped virtuoso
		test.skip('should be able to use keyboard to navigate through sidebar items', async ({ page }) => {
			await page.goto('/home');

			const collapser = poHomeChannel.sidebar.firstCollapser;
			const dataIndex = await collapser.locator('../..').getAttribute('data-item-index');
			const nextItem = page.locator(`[data-item-index="${Number(dataIndex) + 1}"]`).getByRole('link');

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

		// TODO: check if this still fails
		test.skip('should show unread badge on collapser when group is collapsed and has unread items', async ({ page }) => {
			await page.goto('/home');

			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('hello world');

			await poHomeChannel.sidebar.firstCollapser.click();
			const item = poHomeChannel.sidebar.getSearchRoomByName(targetChannel);
			await expect(item).toBeVisible();

			await poHomeChannel.sidebar.markItemAsUnread(item);
			await poHomeChannel.sidebar.escSearch();

			const collapser = poHomeChannel.sidebar.getCollapseGroupByName('Channels');
			await collapser.click();
			await expect(poHomeChannel.sidebar.getItemUnreadBadge(collapser)).toBeVisible();
		});

		test('embedded layout', async ({ page }) => {
			await page.goto('/home');

			await test.step('should not show NavBar', async () => {
				await poHomeChannel.navbar.openChat(targetChannel);
				await expect(page.locator('role=navigation[name="header"]')).toBeVisible();
				const embeddedLayoutURL = `${page.url()}?layout=embedded`;
				await page.goto(embeddedLayoutURL);
				await expect(page.locator('role=navigation[name="header"]')).not.toBeVisible();
			});

			await test.step('should show burger menu', async () => {
				await page.goto('admin/info?layout=embedded');
				await page.setViewportSize({ width: 767, height: 510 });

				await expect(poHomeChannel.content.burgerButton).toBeVisible();
			});
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
			sidepanelTeam = await createTargetTeam(api);

			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: true,
					},
					{
						name: 'secondarySidebar',
						value: true,
					},
				],
			});
		});

		test.afterEach(async ({ api }) => {
			await deleteTeam(api, sidepanelTeam);

			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: false,
					},
					{
						name: 'secondarySidebar',
						value: false,
					},
				],
			});
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

			await poHomeChannel.navbar.openChat(sidepanelTeam);
			await poHomeChannel.content.sendMessage(message);
			await expect(poHomeChannel.sidepanel.getItemByName(sidepanelTeam)).toBeVisible();
		});

		test('should escape special characters on item subtitle', async ({ page }) => {
			await page.goto('/home');
			const message = 'hello > world';
			const parsedWrong = 'hello &gt; world';

			await poHomeChannel.navbar.openChat(sidepanelTeam);
			await poHomeChannel.content.sendMessage(message);

			await expect(poHomeChannel.sidepanel.getItemByName(sidepanelTeam)).toBeVisible();
			await expect(poHomeChannel.sidepanel.getItemByName(sidepanelTeam)).not.toHaveText(parsedWrong);
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

			const sidepanelTeamItem = poHomeChannel.sidepanel.getTeamItemByName(sidepanelTeam);
			const targetChannelItem = poHomeChannel.sidepanel.getTeamItemByName(targetChannel);

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

			const item = poHomeChannel.sidepanel.getTeamItemByName(targetChannel);
			await expect(item.locator('..')).toHaveAttribute('data-item-index', '0');

			await user1Page.close();
		});

		test('sidebar and sidepanel should retain their state after opening a room through navbar search', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidenav.waitForHome();

			await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();

			await expect(poHomeChannel.sidepanel.getSidepanelHeader('Favorites')).toBeVisible();
			await expect(poHomeChannel.sidenav.homepageHeader).toBeVisible();

			await poHomeChannel.navbar.openChat(sidepanelTeam);
			await poHomeChannel.content.waitForChannel();

			await expect(page).toHaveURL(`/group/${sidepanelTeam}`);
			await expect(poHomeChannel.sidepanel.getSidepanelHeader('Favorites')).toBeVisible();
			await expect(poHomeChannel.sidebar.favoritesTeamCollabFilter).toHaveAttribute('aria-selected', 'true');
		});

		test('should show all filters and tablist on sidepanel', async ({ page }) => {
			await page.goto('/home');

			await expect(poHomeChannel.sidebar.teamCollabFilters).toBeVisible();
			await expect(poHomeChannel.sidebar.omnichannelFilters).toBeVisible();

			await expect(poHomeChannel.sidebar.allTeamCollabFilter).toBeVisible();
			await expect(poHomeChannel.sidebar.favoritesTeamCollabFilter).toBeVisible();
			await expect(poHomeChannel.sidebar.discussionsTeamCollabFilter).toBeVisible();
		});

		test('should show favorite team on the sidepanel', async ({ page }) => {
			await page.goto(`/group/${sidepanelTeam}`);
			await poHomeChannel.content.waitForChannel();
			await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();

			await expect(poHomeChannel.sidepanel.getTeamItemByName(sidepanelTeam)).not.toBeVisible();

			await poHomeChannel.roomHeaderFavoriteBtn.click();

			await expect(poHomeChannel.sidepanel.getTeamItemByName(sidepanelTeam)).toBeVisible();
		});

		test('should show discussion in discussions and all sidepanel filter, should remove after deleting discussion', async ({ page }) => {
			await page.goto(`/group/${sidepanelTeam}`);
			await poHomeChannel.content.waitForChannel();

			const discussionName = faker.string.uuid();

			await poHomeChannel.content.btnMenuMoreActions.click();
			await page.getByRole('menuitem', { name: 'Discussion' }).click();
			await poHomeChannel.content.inputDiscussionName.fill(discussionName);
			await poHomeChannel.content.btnCreateDiscussionModal.click();
			await expect(page.getByRole('heading', { name: discussionName })).toBeVisible();

			await poHomeChannel.sidebar.discussionsTeamCollabFilter.click();
			await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toBeVisible();

			await poHomeChannel.sidebar.allTeamCollabFilter.click();
			await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toBeVisible();

			await poHomeChannel.tabs.btnRoomInfo.click();
			await poHomeChannel.tabs.room.btnMore.click();
			await poHomeChannel.tabs.room.getMoreOption('Delete').click();
			await poHomeChannel.tabs.room.confirmDeleteDiscussion();

			await poHomeChannel.sidebar.discussionsTeamCollabFilter.click();
			await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).not.toBeVisible();

			await poHomeChannel.sidebar.allTeamCollabFilter.click();
			await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).not.toBeVisible();
		});

		test('should persist sidepanel state after page reload', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidebar.discussionsTeamCollabFilter.click();
			await poHomeChannel.sidepanel.unreadToggleLabel.click({ force: true });

			await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();
			await expect(poHomeChannel.sidepanel.getSidepanelHeader('Discussions')).toBeVisible();

			await page.reload();

			await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();
			await expect(poHomeChannel.sidepanel.getSidepanelHeader('Discussions')).toBeVisible();
		});

		test('should show unread filter for thread messages', async ({ page, browser }) => {
			const user1Page = await browser.newPage({ storageState: Users.user1.state });
			const user1Channel = new HomeChannel(user1Page);

			await test.step('mark all rooms as read', async () => {
				await page.goto('/home');
				await poHomeChannel.sidenav.waitForHome();
				await poHomeChannel.content.markAllRoomsAsRead();
			});

			await page.goto(`/channel/${targetChannel}`);
			await poHomeChannel.content.waitForChannel();
			await poHomeChannel.content.sendMessage('test thread message');

			await poHomeChannel.navbar.homeButton.click();
			await poHomeChannel.sidebar.allTeamCollabFilter.click();
			await poHomeChannel.sidepanel.unreadToggleLabel.click();

			await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();

			await test.step('send a thread message from another user', async () => {
				await user1Page.goto(`/channel/${targetChannel}`);
				await user1Channel.content.waitForChannel();
				await user1Channel.content.openReplyInThread();
				await user1Channel.content.toggleAlsoSendThreadToChannel(false);
				await user1Channel.content.sendMessageInThread('hello thread');
			});

			await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).toBeVisible();
			await expect(
				poHomeChannel.sidepanel.getItemByName(targetChannel).getByRole('status', { name: '1 unread threaded message' }),
			).toBeVisible();

			await poHomeChannel.sidepanel.getItemByName(targetChannel).click();
			await poHomeChannel.content.waitForChannel();

			await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).toBeVisible();
			await expect(
				poHomeChannel.sidepanel.getItemByName(targetChannel).getByRole('status', { name: '1 unread threaded message' }),
			).toBeVisible();

			await poHomeChannel.content.openReplyInThread();
			await user1Page.close();
		});

		test('unread mentions badges on filters', async ({ page, browser }) => {
			const user1Page = await browser.newPage({ storageState: Users.user1.state });
			const user1Channel = new HomeChannel(user1Page);

			await test.step('mark all rooms as read', async () => {
				await page.goto('/home');
				await poHomeChannel.sidenav.waitForHome();
				await poHomeChannel.content.markAllRoomsAsRead();
			});

			await test.step('should favorite the target channel', async () => {
				await page.goto(`/channel/${targetChannel}`);
				await poHomeChannel.content.waitForChannel();
				await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();

				await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).not.toBeVisible();

				await poHomeChannel.roomHeaderFavoriteBtn.click();

				await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).toBeVisible();
			});

			await test.step('unread state should be empty', async () => {
				await poHomeChannel.sidebar.allTeamCollabFilter.click();
				await poHomeChannel.sidepanel.unreadToggleLabel.click();

				await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();

				await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();

				await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();
			});

			await poHomeChannel.navbar.homeButton.click();

			await test.step('send a mention message from another user', async () => {
				await user1Page.goto(`/channel/${targetChannel}`);
				await user1Channel.content.waitForChannel();
				await user1Channel.content.sendMessage(`hello @${Users.admin.data.username}`);
			});

			await test.step('unread mentions badge should be visible on all filters', async () => {
				await poHomeChannel.sidebar.allTeamCollabFilter.click();

				await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).toBeVisible();
				await expect(poHomeChannel.sidepanel.getItemByName(targetChannel).getByRole('status', { name: '1 mention' })).toBeVisible();
				await expect(poHomeChannel.sidebar.allTeamCollabFilter.getByRole('status', { name: '1 mention from All' })).toBeVisible();

				await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();
				await expect(poHomeChannel.sidepanel.getItemByName(targetChannel)).toBeVisible();
				await expect(poHomeChannel.sidepanel.getItemByName(targetChannel).getByRole('status', { name: '1 mention' })).toBeVisible();
				await expect(
					poHomeChannel.sidebar.favoritesTeamCollabFilter.getByRole('status', { name: '1 mention from Favorites' }),
				).toBeVisible();
			});

			await test.step('read the room', async () => {
				await poHomeChannel.sidepanel.getItemByName(targetChannel).click();
				await poHomeChannel.content.waitForChannel();
			});

			await test.step('unread mentions badge should not be visible on any filters', async () => {
				await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();

				await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();

				await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();

				await poHomeChannel.sidebar.allTeamCollabFilter.click();

				await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();
			});

			await user1Page.close();
		});

		test('should persist sidepanel state after switching admin panel', async ({ page }) => {
			await page.goto('/home');
			await poHomeChannel.sidebar.discussionsTeamCollabFilter.click();
			await poHomeChannel.sidepanel.unreadToggleLabel.click();

			await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();
			await expect(poHomeChannel.sidepanel.getSidepanelHeader('Discussions')).toBeVisible();

			await poHomeChannel.navbar.openAdminPanel();
			await expect(page).toHaveURL(/\/admin/);

			const adminPage = new Admin(page);

			await adminPage.btnClose.click();
			await expect(page).toHaveURL(/\/home/);

			await expect(poHomeChannel.sidepanel.unreadCheckbox).toBeChecked();
			await expect(poHomeChannel.sidepanel.getSidepanelHeader('Discussions')).toBeVisible();
		});

		test.describe('sidebar and sidepanel in small viewport', () => {
			test.beforeEach(async ({ page }) => {
				await page.setViewportSize({ width: 640, height: 460 });
			});

			test('should show button to toggle sidebar/sidepanel', async ({ page }) => {
				await page.goto('/home');

				await expect(poHomeChannel.sidebar.sidebar).not.toBeVisible();
				await expect(poHomeChannel.sidepanel.sidepanel).not.toBeVisible();
				await expect(poHomeChannel.navbar.btnSidebarToggler()).toBeVisible();
			});

			test('should toggle sidebar/sidepanel when clicking the button', async ({ page }) => {
				await page.goto('/home');

				await poHomeChannel.navbar.btnSidebarToggler().click();
				await expect(poHomeChannel.sidebar.sidebar).not.toBeVisible();
				await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();

				await poHomeChannel.navbar.btnSidebarToggler(true).click();
				await expect(poHomeChannel.sidebar.sidebar).not.toBeVisible();
				await expect(poHomeChannel.sidepanel.sidepanel).not.toBeVisible();
			});

			test('toggle sidebar and sidepanel', async ({ page }) => {
				await page.goto('/home');
				await poHomeChannel.navbar.btnSidebarToggler().click();

				await expect(poHomeChannel.sidepanel.sidepanelBackButton).toBeVisible();

				await poHomeChannel.sidepanel.sidepanelBackButton.click();

				await expect(poHomeChannel.sidebar.sidebar).toBeVisible();
				await expect(poHomeChannel.sidepanel.sidepanel).not.toBeVisible();

				await poHomeChannel.sidebar.favoritesTeamCollabFilter.click();

				await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();
				await expect(poHomeChannel.sidepanel.getSidepanelHeader('Favorites')).toBeVisible();
			});

			test('should close nav region when clicking outside of it', async ({ page }) => {
				await page.goto('/home');
				await poHomeChannel.navbar.btnSidebarToggler().click();

				await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();

				await page.click('main', { force: true });

				await expect(poHomeChannel.sidepanel.sidepanel).not.toBeVisible();
				await expect(poHomeChannel.sidebar.sidebar).not.toBeVisible();
			});

			test('should close nav region when opening a room', async ({ page }) => {
				await page.goto('/home');
				await poHomeChannel.navbar.btnSidebarToggler().click();

				await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();

				await poHomeChannel.sidepanel.getItemByName(targetChannel).click();
				await poHomeChannel.content.waitForChannel();
				await expect(poHomeChannel.content.channelHeader).toContainText(targetChannel);

				await expect(poHomeChannel.sidepanel.sidepanel).not.toBeVisible();
				await expect(poHomeChannel.sidebar.sidebar).not.toBeVisible();
			});
		});
	});

	test.describe('Sidebar room filters', () => {
		test.beforeAll(async ({ api }) => {
			sidepanelTeam = await createTargetTeam(api);

			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: true,
					},
					{
						name: 'secondarySidebar',
						value: true,
					},
				],
			});
		});

		test.afterAll(async ({ api }) => {
			await deleteTeam(api, sidepanelTeam);

			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: false,
					},
					{
						name: 'secondarySidebar',
						value: false,
					},
				],
			});
		});

		test('should open rooms when clicking on sidebar filter', async ({ page }) => {
			await page.goto('/home');

			await poHomeChannel.sidenav.waitForHome();

			await expect(poHomeChannel.sidebar.channelsList).toBeVisible();
			await poHomeChannel.sidebar.getSearchRoomByName(sidepanelTeam).click({ force: true });

			await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();
			await expect(poHomeChannel.sidepanel.getSidepanelHeader(sidepanelTeam)).toBeVisible();

			await expect(poHomeChannel.sidepanel.getTeamItemByName(sidepanelTeam)).toBeVisible();
			await expect(page).toHaveURL(`/group/${sidepanelTeam}`);
		});

		test('should open room when clicking on sidepanel item', async ({ page }) => {
			await page.goto('/home');

			await poHomeChannel.sidenav.waitForHome();
			await poHomeChannel.sidebar.getSearchRoomByName(sidepanelTeam).click();

			await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();
			await expect(poHomeChannel.sidepanel.getSidepanelHeader(sidepanelTeam)).toBeVisible();

			await poHomeChannel.sidepanel.getTeamItemByName(sidepanelTeam).click();
			await poHomeChannel.content.waitForChannel();
			await expect(page).toHaveURL(`/group/${sidepanelTeam}`);
		});

		test('should display rooms in direct message filter', async ({ page }) => {
			const discussionName = faker.string.uuid();

			await test.step('create a direct message with user1', async () => {
				await page.goto('/home');
				await poHomeChannel.sidenav.waitForHome();

				await poHomeChannel.navbar.openChat(Users.user1.data.username);
				await poHomeChannel.content.waitForChannel();
				await expect(poHomeChannel.content.channelHeader).toContainText(Users.user1.data.username);
			});

			await test.step('create discussion in DM', async () => {
				await poHomeChannel.content.btnMenuMoreActions.click();
				await page.getByRole('menuitem', { name: 'Discussion' }).click();
				await poHomeChannel.content.inputDiscussionName.fill(discussionName);
				await poHomeChannel.content.btnCreateDiscussionModal.click();
				await poHomeChannel.content.waitForChannel();
				await poHomeChannel.content.sendMessage('hello');

				await expect(page.getByRole('heading', { name: discussionName })).toBeVisible();
			});

			await test.step('open direct message sidebar filter', async () => {
				await poHomeChannel.sidebar.teamsCollapser.click();
				await poHomeChannel.sidebar.channelsCollapser.click();

				await expect(poHomeChannel.sidebar.directMessagesCollapser).toBeVisible();
				await expect(poHomeChannel.sidebar.directMessagesCollapser.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
				await expect(poHomeChannel.sidebar.getSearchRoomByName(Users.user1.data.username)).toBeVisible();

				await poHomeChannel.sidebar.getSearchRoomByName(Users.user1.data.username).click();

				await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();
				await expect(poHomeChannel.sidepanel.getSidepanelHeader(Users.user1.data.username)).toBeVisible();
				await expect(poHomeChannel.sidepanel.getMainRoomByName(Users.user1.data.username)).toBeVisible();
				await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toBeVisible();
				await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toContainText('hello');

				await poHomeChannel.sidepanel.getMainRoomByName(Users.user1.data.username).click();
				await poHomeChannel.content.waitForChannel();
				await poHomeChannel.content.sendMessage('hello DM');

				await expect(poHomeChannel.content.channelHeader).toContainText(Users.user1.data.username);
				await expect(page).toHaveURL(/direct/);
				await expect(poHomeChannel.sidepanel.getMainRoomByName(Users.user1.data.username)).toHaveAttribute('aria-selected', 'true');
				await expect(poHomeChannel.sidepanel.getMainRoomByName(Users.user1.data.username)).toContainText('hello DM');
				await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toHaveAttribute('aria-selected', 'false');
				await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toContainText('hello');

				await poHomeChannel.sidepanel.getItemByName(discussionName).click();
				await poHomeChannel.content.waitForChannel();

				await expect(page).toHaveURL(/group/);
				await expect(poHomeChannel.sidepanel.getMainRoomByName(Users.user1.data.username)).toHaveAttribute('aria-selected', 'false');
				await expect(poHomeChannel.sidepanel.getMainRoomByName(Users.user1.data.username)).toContainText('hello DM');
				await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toHaveAttribute('aria-selected', 'true');
				await expect(poHomeChannel.sidepanel.getItemByName(discussionName)).toContainText('hello');
				await expect(poHomeChannel.sidepanel.getSidepanelHeader(Users.user1.data.username)).toBeVisible();
			});
		});

		test('should not open rooms when clicking on sidebar filters in small viewport', async ({ page }) => {
			await page.setViewportSize({ width: 640, height: 460 });
			await page.goto('/home');

			await poHomeChannel.sidenav.waitForHome();

			await expect(poHomeChannel.sidebar.sidebar).not.toBeVisible();
			await expect(poHomeChannel.sidepanel.sidepanel).not.toBeVisible();
			await poHomeChannel.navbar.btnSidebarToggler().click();
			await expect(poHomeChannel.sidepanel.sidepanel).toBeVisible();
		});
	});
});
