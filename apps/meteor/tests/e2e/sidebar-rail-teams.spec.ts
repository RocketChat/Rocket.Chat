import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel, deleteTeam, setSettingValueById, setUserPreferences } from './utils';
import { preserveSettings } from './utils/preserveSettings';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const setSidebarRail = (api: Parameters<typeof setUserPreferences>[0], value: boolean) =>
	setUserPreferences(api, { featuresPreview: [{ name: 'sidebarRail', value }] });

test.describe.serial('sidebar rail: Teams', () => {
	let poHomeChannel: HomeChannel;
	const prefix = `000${faker.string.numeric(8)}`;
	const firstTeam = `${prefix}-alpha`;
	const secondTeam = `${prefix}-beta`;
	const teamChannel = `${prefix}-channel-${faker.string.alpha({ length: 8, casing: 'lower' })}`;

	preserveSettings(['Accounts_AllowFeaturePreview']);

	test.beforeAll(async ({ api }) => {
		const response = await api.post('/teams.create', { name: firstTeam, type: 0 });
		const { team } = await response.json();
		await api.post('/teams.create', { name: secondTeam, type: 0 });
		await api.post('/channels.create', { name: teamChannel, extraData: { teamId: team._id } });
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, teamChannel);
		await Promise.all([deleteTeam(api, firstTeam), deleteTeam(api, secondTeam), setSidebarRail(api, false)]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.describe('with the preview on', () => {
		test.beforeAll(async ({ api }) => {
			await setSidebarRail(api, true);
		});

		test.beforeEach(async () => {
			await poHomeChannel.goto();
			await poHomeChannel.sidebarRail.btnTeams.click();
			await expect(poHomeChannel.sidebar.teamsHeading).toBeVisible();
		});

		test('should list each team with its rooms, and go back to the room list from the Inbox item', async () => {
			const { sidebar, sidebarRail } = poHomeChannel;

			await test.step('teams start collapsed', async () => {
				await expect(sidebar.getTeamToggle(firstTeam)).toHaveAttribute('aria-expanded', 'false');
				await expect(sidebar.getTeamRoomLink(teamChannel)).not.toBeVisible();
			});

			await test.step('expand a team', async () => {
				await sidebar.getTeamToggle(firstTeam).click();
				await expect(sidebar.getTeamRoomLink(firstTeam)).toBeVisible();
				await expect(sidebar.getTeamRoomLink(teamChannel)).toBeVisible();
			});

			await test.step('the expanded team is remembered after a reload', async () => {
				await poHomeChannel.page.reload();
				await expect(sidebar.teamsHeading).toBeVisible();
				await expect(sidebar.getTeamRoomLink(teamChannel)).toBeVisible();
				await sidebar.getTeamToggle(firstTeam).click();
				await expect(sidebar.getTeamRoomLink(teamChannel)).not.toBeVisible();
			});

			await test.step('the Inbox item brings back the room list', async () => {
				await sidebarRail.btnInbox.click();
				await expect(sidebar.teamsHeading).not.toBeVisible();
				await expect(sidebar.channelsList).toBeVisible();
			});
		});

		test('should filter teams and rooms by name, and show every team again on Esc', async () => {
			const { sidebar } = poHomeChannel;

			await test.step('type part of a room name', async () => {
				await sidebar.btnSearchTeams.click();
				await expect(sidebar.inputSearchTeams).toBeFocused();
				await sidebar.inputSearchTeams.fill(teamChannel.toUpperCase());
				await expect(sidebar.getTeamRoomLink(teamChannel)).toBeVisible();
				await expect(sidebar.getCollapseGroupByName(secondTeam)).not.toBeVisible();
			});

			await test.step('type a name no team or room has', async () => {
				await sidebar.inputSearchTeams.fill(faker.string.uuid());
				await expect(sidebar.searchNoResults).toBeVisible();
			});

			await test.step('close the search with Esc', async () => {
				await sidebar.inputSearchTeams.press('Escape');
				await expect(sidebar.inputSearchTeams).not.toBeVisible();
				await expect(sidebar.btnSearchTeams).toBeFocused();
				await expect(sidebar.getCollapseGroupByName(firstTeam)).toBeVisible();
				await expect(sidebar.getCollapseGroupByName(secondTeam)).toBeVisible();
			});
		});

		test('should move a team, set its unread options and open its info from the team menu', async ({ page }) => {
			const { sidebar } = poHomeChannel;
			const ownTeams = (order: string[]) => order.filter((name) => [firstTeam, secondTeam].includes(name));

			await test.step('teams start alphabetical', async () => {
				await expect.poll(async () => ownTeams(await sidebar.getTeamOrder())).toEqual([firstTeam, secondTeam]);
			});

			await test.step('move the second team up', async () => {
				await sidebar.selectTeamMenuItem(secondTeam, 'Move up');
				await expect.poll(async () => ownTeams(await sidebar.getTeamOrder())).toEqual([secondTeam, firstTeam]);
			});

			await test.step('turn Always display on, with the menu left open', async () => {
				await sidebar.selectTeamMenuItem(firstTeam, 'Always display');
				await expect(sidebar.menuOptions.getCheckboxItem('Always display').getByRole('checkbox')).toBeChecked();
				await page.keyboard.press('Escape');
				await sidebar.menuOptions.waitForDismissal();
			});

			await test.step('open Team info', async () => {
				await sidebar.selectTeamMenuItem(firstTeam, 'Team info');
				await expect(page).toHaveURL(new RegExp(`/${firstTeam}/team-info`));
				await expect(sidebar.teamsHeading).toBeVisible();
			});
		});

		test('should not have any accessibility violations in the Teams section and the rail', async ({ makeAxeBuilder }) => {
			await poHomeChannel.sidebar.getTeamToggle(firstTeam).click();
			await expect(poHomeChannel.sidebar.getTeamRoomLink(teamChannel)).toBeVisible();
			await expect(poHomeChannel.sidebarRail.btnSidebarPreferences).toBeVisible();

			const results = await makeAxeBuilder().include('nav[aria-label="Sidebar"]').include('nav[aria-label="Sidebar rail"]').analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe('with the preview off', () => {
		test.beforeAll(async ({ api }) => {
			await setSidebarRail(api, false);
		});

		test('should show the room list, with no Teams item or Teams section', async () => {
			await poHomeChannel.goto();

			await expect(poHomeChannel.sidebar.channelsList).toBeVisible();
			await expect(poHomeChannel.sidebarRail.btnTeams).not.toBeVisible();
			await expect(poHomeChannel.sidebar.teamsHeading).not.toBeVisible();
		});
	});
});
