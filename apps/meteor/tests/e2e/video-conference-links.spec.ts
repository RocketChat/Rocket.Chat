import { faker } from '@faker-js/faker';
import type { Locator, Page } from '@playwright/test';
import type { IRoom } from '@rocket.chat/core-typings';

import { BASE_URL, IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { ConferenceWindow, HomeChannel } from './page-objects';
import {
	createConferenceLink,
	createTargetChannelAndReturnFullRoom,
	deleteChannel,
	emptyConference,
	getVideoConferenceProviderName,
	leaveCallAs,
	listConferenceLinks,
	listJoinableCalls,
	setSettingValueById,
	startConferenceFromLink,
} from './utils';
import { preserveSettings } from './utils/preserveSettings';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

// A real LiveKit server, for the case that stays in a call. Without one, a call window that cannot connect leaves
// the call and closes, so that case is skipped.
const sfu = {
	url: process.env.E2E_LIVEKIT_URL,
	apiKey: process.env.E2E_LIVEKIT_API_KEY,
	apiSecret: process.env.E2E_LIVEKIT_API_SECRET,
};
const hasSfu = Boolean(sfu.url && sfu.apiKey && sfu.apiSecret);

// The server never contacts the SFU on its own, so placeholder values are enough to register the native provider.
// The browser does: only a case that joins media needs the real ones.
const nativeProviderSettings = {
	VideoConf_LiveKit_Enabled: true,
	VideoConf_LiveKit_Url: sfu.url || 'wss://livekit.invalid',
	VideoConf_LiveKit_Api_Key: sfu.apiKey || 'api-key',
	VideoConf_LiveKit_Api_Secret: sfu.apiSecret || 'api-secret',
	VideoConf_Conference_Window_Enabled: true,
	VideoConf_Default_Provider: 'livekit',
} as const;

const callers = [Users.user1, Users.user2];

const phone = { width: 375, height: 812 };

// An address is unique across the workspace and earlier runs leave links behind, so every title carries a token of
// its own. Letters only, so the address a title takes can be written down from the title alone.
const runToken = () => faker.string.alpha({ length: 10, casing: 'lower' });

const slugOf = (title: string) => title.toLowerCase().split(' ').join('-');

const addressOf = (slug: string) => `${BASE_URL}/conference/${slug}`;

const expectInsideViewport = async (locator: Locator, width: number) => {
	await expect(locator).toBeVisible();
	const box = await locator.boundingBox();

	expect(box).not.toBeNull();
	expect(box?.x).toBeGreaterThanOrEqual(0);
	expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
};

/**
 * Conference links, walked through the room header's video call menu and the call window they open.
 *
 * Every other suite runs on the tester app's provider, which runs no call inside Rocket.Chat and so never shows
 * the menu. This one switches the workspace to the native provider for its own cases and puts every setting back
 * afterwards.
 *
 * A conference that has to be running while a case looks at it is started through the API by a user who opens no
 * window: nobody joins it, so nothing ends it until the case empties it on the way out.
 */
test.describe('video conference links', () => {
	let poHomeChannel: HomeChannel;
	let auxPages: Page[] = [];
	let disposableChannels: string[] = [];
	let startedConferences: string[] = [];

	test.skip(!IS_EE, 'Enterprise Only');

	preserveSettings(Object.keys(nativeProviderSettings));

	test.beforeAll(async ({ api }) => {
		for (const [id, value] of Object.entries(nativeProviderSettings)) {
			await setSettingValueById(api, id, value);
		}

		// Without the `video-conference-native` license module the provider never registers, and every case below
		// would be asserting against a header button that is not a menu. Said in the output, never a quiet pass.
		let providerName: string | undefined;
		await expect
			.poll(async () => {
				providerName = await getVideoConferenceProviderName(api);
				return providerName;
			})
			.toBe('livekit')
			.catch(() => undefined);

		test.skip(
			providerName !== 'livekit',
			`The native provider did not register (the workspace license has no video-conference-native module?); the active provider is ${providerName ?? 'none'}.`,
		);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.afterEach(async ({ api, page, request }) => {
		await Promise.all(auxPages.map((auxPage) => auxPage.context().close()));
		auxPages = [];

		await Promise.all(
			page
				.context()
				.pages()
				.filter((openPage) => openPage !== page)
				.map((openPage) => openPage.close()),
		);

		// A window reloaded or closed mid-call may never report its leave, so whoever is still in a call is taken out
		// of it here.
		await Promise.all(
			callers.map(async (user) => {
				const calls = await listJoinableCalls(request, user);
				await Promise.all(calls.filter(({ joined }) => joined).map(({ callId }) => leaveCallAs(request, user, callId)));
			}),
		);

		// A conference nobody ever joined would otherwise stay live for a day.
		await Promise.all(startedConferences.map((callId) => emptyConference(api, callId)));
		startedConferences = [];

		await Promise.all(disposableChannels.map((name) => deleteChannel(api, name)));
		disposableChannels = [];

		await expect.poll(async () => (await Promise.all(callers.map((user) => listJoinableCalls(request, user)))).flat().length).toBe(0);
	});

	const createChannel = async (api: BaseTest['api']): Promise<IRoom & { name: string }> => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, { members: ['user1', 'user2'] });
		const name = channel.name as string;
		disposableChannels.push(name);

		return { ...channel, name };
	};

	const startConference = async (api: BaseTest['api'], roomId: string, slug: string): Promise<string> => {
		const callId = await startConferenceFromLink(api, roomId, slug);
		startedConferences.push(callId);

		return callId;
	};

	test('should create a link, copy it, open it, and offer to join it while its conference runs', async ({
		api,
		browser,
		context,
		page,
	}) => {
		// Two users, call windows and the app behind them: more than the default minute on a loaded runner.
		test.setTimeout(120_000);
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		const channel = await createChannel(api);
		const title = `Planning ${runToken()}`;
		const slug = slugOf(title);
		const address = addressOf(slug);
		const menu = poHomeChannel.videoCallMenu;

		await poHomeChannel.gotoChannel(channel.name);

		await test.step('the header button offers to start a conference or create a link, and lists no links yet', async () => {
			await menu.open();

			await expect(menu.btnStartConference).toBeVisible();
			await expect(menu.btnCreateLink).toBeVisible();
			await expect(menu.textConferenceLinks).toHaveCount(0);
		});

		await test.step('a link created from the menu is listed under its title, at the address its title gives', async () => {
			await menu.btnCreateLink.click();
			await expect(menu.textCreateLinkTitle).toBeVisible();

			await menu.inputLinkName.fill(title);
			await menu.btnCreate.click();

			await expect(menu.textCreateLinkTitle).toHaveCount(0);
			await poHomeChannel.toastMessage.waitForDisplay({ type: 'success', message: 'Link created' });

			await menu.open();
			await expect(menu.getBtnLink(title)).toBeVisible();
			await page.keyboard.press('Escape');

			expect((await listConferenceLinks(api, channel._id)).map(({ url }) => url)).toEqual([slug]);
		});

		await test.step('copying the link puts its address on the clipboard', async () => {
			await menu.openLinkActions(title);
			await menu.getBtnLinkAction(title, 'Copy link').click();

			await poHomeChannel.toastMessage.waitForDisplay({ type: 'success', message: 'Copied' });
			await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(address);
		});

		await test.step('opening the link shows the start preflight, named after the link, at its address', async () => {
			await menu.openLinkActions(title);
			const callWindow = await ConferenceWindow.openedBy(page, () => menu.getBtnLinkAction(title, 'Open').click());

			await expect(callWindow.getPreflightHeading('Start a new conference')).toBeVisible();
			await expect(callWindow.inputCallName).toHaveValue(title);
			await expect(callWindow.inputCallName).not.toBeEditable();
			await expect(callWindow.page).toHaveURL(address);

			// Starting from here would join media, which needs a real SFU: the case below does that.
			await callWindow.page.close();
		});

		const callId = await test.step('a conference started from the link is the only one it runs', async () => {
			const started = await startConference(api, channel._id, slug);

			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(1);
			expect(await listConferenceLinks(api, channel._id)).toEqual([expect.objectContaining({ url: slug, ongoingCallId: started })]);

			// A second start answers the conference already running rather than starting another.
			expect(await startConferenceFromLink(api, channel._id, slug)).toBe(started);
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(1);

			return started;
		});

		await test.step('a second user opening the same address is offered to join that conference', async () => {
			const { page: user2Page } = await createAuxContext(browser, Users.user2);
			auxPages.push(user2Page);

			const user2Window = await ConferenceWindow.openAt(user2Page, address, (window) => window.getPreflightHeading('Join the conference'));

			await expect(user2Window.btnJoinCall).toBeVisible();
			await expect(user2Window.page).toHaveURL(address);
		});

		await test.step('the menu shows the link as ongoing and offers to join it', async () => {
			// Read afresh: the list in the page was read before the conference started.
			await poHomeChannel.gotoChannel(channel.name);
			await menu.open();
			// Opened only once the row says so: a row that changes under an open sub menu closes it.
			await expect(menu.getBtnOngoingLink(title)).toBeVisible();
			await expect(menu.getTextOngoing(title)).toBeVisible();

			await menu.getBtnOngoingLink(title).click();
			await expect(menu.getBtnLinkAction(title, 'Join call')).toBeVisible();
			await expect(menu.getBtnLinkAction(title, 'Open')).toHaveCount(0);
		});

		await test.step('opening the address again reaches the same conference, and starts nothing', async () => {
			const callWindow = await ConferenceWindow.openAt(await context.newPage(), address, (window) =>
				window.getPreflightHeading('Join the conference'),
			);

			await expect(callWindow.page).toHaveURL(address);
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(1);
			expect((await listConferenceLinks(api, channel._id))[0].ongoingCallId).toBe(callId);
		});
	});

	test('should keep the address of a link while two people are in its conference and one reloads', async ({ api, browser, page }) => {
		test.skip(
			!hasSfu,
			'Joining a conference needs a real LiveKit server: set E2E_LIVEKIT_URL, E2E_LIVEKIT_API_KEY and E2E_LIVEKIT_API_SECRET.',
		);
		test.setTimeout(120_000);

		const channel = await createChannel(api);
		const title = `Planning ${runToken()}`;
		const slug = slugOf(title);
		const address = addressOf(slug);
		const menu = poHomeChannel.videoCallMenu;

		await createConferenceLink(api, channel._id, title);
		await poHomeChannel.gotoChannel(channel.name);

		const callWindow = await test.step('starting from the link puts the starter in the call at its address', async () => {
			await menu.openLinkActions(title);
			const window = await ConferenceWindow.openedBy(page, () => menu.getBtnLinkAction(title, 'Open').click());
			await window.btnStartCall.click();

			await expect(window.getBtnMembers(1)).toBeVisible();
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(1);
			await expect(window.page).toHaveURL(address);

			return window;
		});

		await test.step('a second user joins the same call from the same address', async () => {
			const { page: user2Page } = await createAuxContext(browser, Users.user2);
			auxPages.push(user2Page);

			const user2Window = await ConferenceWindow.openAt(user2Page, address, (window) => window.getPreflightHeading('Join the conference'));
			await user2Window.btnJoinCall.click();

			await expect(user2Window.getBtnMembers(2)).toBeVisible();
			await expect(callWindow.getBtnMembers(2)).toBeVisible();
			await expect(user2Window.page).toHaveURL(address);
			await expect(callWindow.page).toHaveURL(address);
		});

		await test.step('reloading the starter window lands on the join preflight of the same call', async () => {
			const [{ ongoingCallId }] = await listConferenceLinks(api, channel._id);

			await callWindow.page.reload();

			await expect(callWindow.getPreflightHeading('Join the conference')).toBeVisible();
			await expect(callWindow.page).toHaveURL(address);
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(1);
			expect((await listConferenceLinks(api, channel._id))[0].ongoingCallId).toBe(ongoingCallId);
		});
	});

	test('should rename a link and move its address with the name', async ({ api, context, page }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		const channel = await createChannel(api);
		const token = runToken();
		const oldTitle = `Planning ${token}`;
		const newTitle = `Retro ${token}`;
		const menu = poHomeChannel.videoCallMenu;

		expect((await createConferenceLink(api, channel._id, oldTitle)).url).toBe(slugOf(oldTitle));

		await poHomeChannel.gotoChannel(channel.name);

		await test.step('Rename opens a dialog holding the title and saying that the address changes', async () => {
			await menu.openLinkActions(oldTitle);
			await menu.getBtnLinkAction(oldTitle, 'Rename').click();

			await expect(menu.textRenameLinkTitle).toBeVisible();
			await expect(menu.inputLinkName).toHaveValue(oldTitle);
			await expect(menu.textRenameHint).toBeVisible();
		});

		await test.step('a new name replaces the old one in the menu', async () => {
			await menu.inputLinkName.fill(newTitle);
			await menu.btnRename.click();

			await poHomeChannel.toastMessage.waitForDisplay({ type: 'success', message: 'Link renamed' });

			await menu.open();
			await expect(menu.getBtnLink(newTitle)).toBeVisible();
			await expect(menu.getBtnLink(oldTitle)).toHaveCount(0);
			await page.keyboard.press('Escape');
		});

		await test.step('the link is copied with the address of its new name', async () => {
			await menu.openLinkActions(newTitle);
			await menu.getBtnLinkAction(newTitle, 'Copy link').click();

			await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(addressOf(slugOf(newTitle)));
		});

		await test.step('the new address opens the link under its new name', async () => {
			const callWindow = await ConferenceWindow.openAt(await context.newPage(), addressOf(slugOf(newTitle)), (window) =>
				window.getPreflightHeading('Start a new conference'),
			);

			await expect(callWindow.getPreflightHeading('Start a new conference')).toBeVisible();
			await expect(callWindow.inputCallName).toHaveValue(newTitle);
		});

		await test.step('and the old address opens nothing', async () => {
			const callWindow = await ConferenceWindow.openAt(
				await context.newPage(),
				addressOf(slugOf(oldTitle)),
				(window) => window.textNotAuthorized,
			);

			await expect(callWindow.textNotAuthorized).toBeVisible();
		});
	});

	test('should delete a link and stop its address', async ({ api, context }) => {
		const channel = await createChannel(api);
		const title = `Planning ${runToken()}`;
		const menu = poHomeChannel.videoCallMenu;

		await createConferenceLink(api, channel._id, title);

		await poHomeChannel.gotoChannel(channel.name);

		await test.step('Delete asks first, naming the link', async () => {
			await menu.openLinkActions(title);
			await menu.getBtnLinkAction(title, 'Delete').click();

			await expect(menu.textDeleteLinkTitle).toBeVisible();
			await expect(menu.getTextDeleteLink(title)).toBeVisible();
		});

		await test.step('confirming takes it out of the menu, and the menu has no links left', async () => {
			await menu.btnDelete.click();

			await poHomeChannel.toastMessage.waitForDisplay({ type: 'success', message: 'Link deleted' });

			await menu.open();
			await expect(menu.btnCreateLink).toBeVisible();
			await expect(menu.getBtnLink(title)).toHaveCount(0);
			await expect(menu.textConferenceLinks).toHaveCount(0);

			expect(await listConferenceLinks(api, channel._id)).toEqual([]);
		});

		await test.step('its address opens nothing', async () => {
			const callWindow = await ConferenceWindow.openAt(
				await context.newPage(),
				addressOf(slugOf(title)),
				(window) => window.textNotAuthorized,
			);

			await expect(callWindow.textNotAuthorized).toBeVisible();
		});
	});

	test.describe('at phone width', () => {
		test.use({ viewport: phone, hasTouch: true });

		// The document itself is not measured: with a sub menu open it is a few pixels wider than the screen while
		// everything on it stays inside, a known gap. What a user has to reach is.
		test('should reach the menu, the create dialog, the link actions and the start preflight at phone width', async ({ api, page }) => {
			const channel = await createChannel(api);
			const token = runToken();
			const seededTitle = `Planning ${token}`;
			const createdTitle = `Standup ${token}`;
			const menu = poHomeChannel.videoCallMenu;

			await createConferenceLink(api, channel._id, seededTitle);

			await poHomeChannel.gotoChannel(channel.name);

			await test.step('the video call button stays on the header and opens the menu', async () => {
				await expect(menu.btnVideoCall).toBeVisible();
				await menu.open();
				await expect(menu.btnCreateLink).toBeVisible();
			});

			await test.step('the create dialog fits the screen and creates a link', async () => {
				await menu.btnCreateLink.tap();

				for (const locator of [menu.textCreateLinkTitle, menu.inputLinkName, menu.btnCreate, menu.btnCancelCreate]) {
					await expectInsideViewport(locator, phone.width);
				}

				await menu.inputLinkName.fill(createdTitle);
				await menu.btnCreate.tap();
				await poHomeChannel.toastMessage.waitForDisplay({ type: 'success', message: 'Link created' });

				await menu.open();
				await expect(menu.getBtnLink(createdTitle)).toBeVisible();
				await page.keyboard.press('Escape');
			});

			await test.step("a link's actions open by tap and fit the screen", async () => {
				await menu.openLinkActions(seededTitle, { tap: true });

				for (const action of ['Open', 'Copy link', 'Rename', 'Delete'] as const) {
					await expectInsideViewport(menu.getBtnLinkAction(seededTitle, action), phone.width);
				}
			});

			await test.step("Open shows the start preflight within the screen, at the link's address", async () => {
				const callWindow = await ConferenceWindow.openedBy(page, () => menu.getBtnLinkAction(seededTitle, 'Open').tap());

				await expect(callWindow.getPreflightHeading('Start a new conference')).toBeVisible();
				await expectInsideViewport(callWindow.btnStartCall, phone.width);
				await expect(callWindow.page).toHaveURL(addressOf(slugOf(seededTitle)));
			});
		});
	});
});
