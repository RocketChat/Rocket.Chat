import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import type { IUserState } from './fixtures/userStates';
import { Users } from './fixtures/userStates';
import { ConferenceWindow, HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel, isChannelMember, setSettingValueById } from './utils';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

type Session = { page: Page; poHomeChannel: HomeChannel };

/**
 * The flow `VideoConf_Conference_Window_Enabled` turns on: a conference is placed, answered, joined and left in a
 * window of its own, and an incoming call is a row in the navbar's ongoing-calls list rather than a popup that
 * takes over the callee's screen.
 *
 * `video-conference-ring.spec.ts` is the proof the setting leaves the old flow alone, and is byte-identical to
 * develop for exactly that reason. This file is the proof of what replaces it, and nearly all of it needs two
 * browser contexts and two windows: a call has a caller and a callee, and the caller's own call lives in a
 * separate window from the app that placed it.
 *
 * Deliberate choices worth knowing before changing anything here:
 *
 * - **Names are how rows are addressed.** A call row is a link named after the call, so a call started in a
 *   channel is given a unique name at the preflight and that name is what picks its row out of the list. Unique
 *   rather than merely descriptive because these tests run alongside each other: it means one test cannot
 *   mistake another test's call for its own.
 * - **A call drops out of the joinable list the moment its last participant leaves** (`listJoinableCalls` skips
 *   calls nobody is in), so closing the call windows a test opened is enough cleanup for the next one — the
 *   ten-second empty-call grace only governs when the conference is *ended*, not when it stops being offered.
 * - **A conference in a channel rings nobody** on this branch (`ee/server/configuration/videoConference.ts`
 *   registers ringing for DMs and group DMs only), so the other side discovers it through the list's own
 *   twenty-second poll. Those assertions carry an explicit timeout, which is a wait on a condition rather than
 *   a pause.
 */
test.describe('video conference call window', () => {
	let poHomeChannel: HomeChannel;
	let auxSessions: Page[] = [];
	let disposableChannels: string[] = [];

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'VideoConf_Conference_Window_Enabled', true);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'VideoConf_Conference_Window_Enabled', false);
	});

	test.beforeEach(async ({ page }) => {
		// These are multi-window journeys, and two of them wait on the joinable list's twenty-second poll for a
		// conference in a channel, which rings nobody. The default sixty seconds is not enough for that.
		test.setTimeout(150_000);

		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterEach(async ({ api, page }) => {
		// The aux contexts go first, and whole: closing a context takes the call windows opened inside it with it,
		// and each of those reports its user leaving on the way out. That is what keeps a call from being offered
		// to the next test.
		await Promise.all(auxSessions.map((auxPage) => auxPage.context().close()));
		auxSessions = [];

		await Promise.all(
			page
				.context()
				.pages()
				.filter((openPage) => openPage !== page)
				.map((callWindow) => callWindow.close()),
		);

		await Promise.all(disposableChannels.map((name) => deleteChannel(api, name)));
		disposableChannels = [];
	});

	const openSessionAs = async (browser: Browser, user: IUserState): Promise<Session> => {
		const { page } = await createAuxContext(browser, user);
		auxSessions.push(page);

		return { page, poHomeChannel: new HomeChannel(page) };
	};

	const createSharedChannel = async (api: BaseTest['api'], members = ['user1', 'user2']): Promise<string> => {
		const name = await createTargetChannel(api, { members });
		disposableChannels.push(name);

		return name;
	};

	const openCallWindow = (session: { page: Page; poHomeChannel: HomeChannel }): Promise<ConferenceWindow> =>
		ConferenceWindow.openedBy(session.page, () => session.poHomeChannel.content.btnVideoCall.click());

	/**
	 * Starts a conference in a channel under a name of this test's own, and lands in it.
	 *
	 * The name is what makes the call addressable in the ongoing-calls list, and unique enough that no other
	 * test's call can answer for it.
	 */
	const startNamedConference = async (session: Session, channel: string, name: string): Promise<ConferenceWindow> => {
		await session.poHomeChannel.navbar.openChat(channel);

		const callWindow = await openCallWindow(session);

		await expect(callWindow.inputCallName).toHaveValue(`Meeting in "${channel}"`);
		await callWindow.inputCallName.fill(name);
		await callWindow.btnStartCall.click();
		await expect(callWindow.getBtnMembers(1)).toBeVisible();

		return callWindow;
	};

	/** Answers, or joins, the call listed under `name`, and returns the window it opened. */
	const joinFromList = async (session: Session, name: string): Promise<ConferenceWindow> => {
		await session.poHomeChannel.ongoingCalls.ensureOpen();

		return ConferenceWindow.openedBy(session.page, () => session.poHomeChannel.ongoingCalls.getCall(name).click());
	};

	test('should open the call in its own window instead of asking in the room', async ({ page }) => {
		await poHomeChannel.navbar.openChat('user2');

		const callWindow = await openCallWindow({ page, poHomeChannel });

		await test.step('opens a window on the conference route', async () => {
			await expect(callWindow.page).toHaveURL(/\/conference\/new\?.*rid=/);
		});

		await test.step('asks nothing in the room', async () => {
			// Neither the popup that used to ask about mic and camera, nor the one that used to hold the wait: the
			// window does both now.
			await expect(poHomeChannel.content.getVideoConfPopup('Start a call with user2')).not.toBeVisible();
			await expect(poHomeChannel.content.getVideoConfPopup('Calling user2')).not.toBeVisible();
		});

		await callWindow.page.close();
	});

	// Qase case 10.
	test('should leave no trace when the start preflight is cancelled', async ({ api, page, browser }) => {
		const channel = await createSharedChannel(api);
		const callName = `Meeting in "${channel}"`;
		const user2 = await openSessionAs(browser, Users.user2);

		await poHomeChannel.navbar.openChat(channel);

		const callWindow = await openCallWindow({ page, poHomeChannel });

		await test.step('the window opens on a preflight for a conference that does not exist yet', async () => {
			await expect(callWindow.page).toHaveURL(/\/conference\/new\?.*rid=/);
			await expect(callWindow.getPreflightHeading('Start a new conference')).toBeVisible();
		});

		await test.step('cancelling closes the window', async () => {
			await callWindow.btnCancel.click();
			await expect.poll(() => callWindow.page.isClosed()).toBe(true);
		});

		await test.step('no conference message was posted', async () => {
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(0);
		});

		await test.step('no call is listed in the room history', async () => {
			await poHomeChannel.roomToolbar.openCalls();
			await expect(page.getByRole('dialog', { name: 'Calls' }).getByText('No history')).toBeVisible();
		});

		await test.step('and nobody was offered a call', async () => {
			await expect(user2.poHomeChannel.ongoingCalls.findCallAnywhere(callName)).toHaveCount(0);
		});
	});

	// Qase case 11, and the half of case 49 that can be asserted from outside the window.
	test('should create the conference when the preflight is confirmed and settle the window on it', async ({ page }) => {
		await poHomeChannel.navbar.openChat('user2');

		const conferencesBefore = await poHomeChannel.content.videoConfMessageBlock.count();
		const callWindow = await openCallWindow({ page, poHomeChannel });

		await test.step('a direct call names the person being called', async () => {
			await expect(callWindow.getPreflightHeading('Start conference with user2')).toBeVisible();
		});

		await callWindow.getBtnCall('user2').click();

		await test.step('the window settles on the conference it just created', async () => {
			await expect(callWindow.page).toHaveURL(/\/conference\/[^/?]+$/);
			await expect(callWindow.getBtnMembers(1)).toBeVisible();
			await expect(callWindow.frameProvider).toBeVisible();
		});

		await test.step('and the room has the conference message', async () => {
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(conferencesBefore + 1);
		});

		const conferenceUrl = callWindow.page.url();

		await test.step('reloading the window does not start a second conference', async () => {
			await callWindow.page.reload();

			// Only that the window comes back on the same conference and that the room still holds one call. What
			// it *shows* on the way back is deliberately not asserted here: the join lives in the window's own
			// query cache, so a reload asks the join preflight again — see the note in the report.
			await expect(callWindow.page).toHaveURL(conferenceUrl);
			await expect(poHomeChannel.content.videoConfMessageBlock).toHaveCount(conferencesBefore + 1);
		});
	});

	// Qase case 12, and case 41's "a call to offer is what puts the button there".
	test('should name a group conference on the way in and list it under that name', async ({ api, page, browser }) => {
		const channel = await createSharedChannel(api);
		const callName = `Sprint sync ${faker.string.uuid()}`;
		const user2 = await openSessionAs(browser, Users.user2);

		await test.step('nothing is offered to user2 before the call', async () => {
			await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeHidden();
		});

		await poHomeChannel.navbar.openChat(channel);

		const callWindow = await openCallWindow({ page, poHomeChannel });

		await test.step('the preflight offers the room as the name and asks nothing about ringing', async () => {
			await expect(callWindow.getPreflightHeading('Start a new conference')).toBeVisible();
			await expect(callWindow.inputCallName).toHaveValue(`Meeting in "${channel}"`);
			// A channel announces a call rather than ringing it, so there is nothing for the switch to change.
			await expect(callWindow.checkboxRingPeople).toHaveCount(0);
		});

		await callWindow.inputCallName.fill(callName);
		await callWindow.btnStartCall.click();

		await test.step('the name the caller chose is what the call is called', async () => {
			await expect(callWindow.getBtnMembers(1)).toBeVisible();
			await expect(callWindow.topBar.getByText(callName)).toBeVisible();
		});

		await test.step('and what the other side finds it listed under', async () => {
			// A conference in a channel rings nobody, so this is the joinable list's own poll finding it.
			await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeVisible({ timeout: 45_000 });
			await user2.poHomeChannel.ongoingCalls.ensureOpen();
			await expect(user2.poHomeChannel.ongoingCalls.getCall(callName)).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.regionOngoingCalls.getByText('1 person joined')).toBeVisible();
		});
	});

	// Qase case 13.
	test('should honour the ring choice on a direct call', async ({ page }) => {
		await poHomeChannel.navbar.openChat('user2');

		const callWindow = await openCallWindow({ page, poHomeChannel });

		await test.step('the preflight asks, and says what saying yes means', async () => {
			await expect(callWindow.checkboxRingPeople).toBeChecked();
			await expect(callWindow.textWillBeNotified).toBeVisible();
		});

		await test.step('saying no takes the promise back', async () => {
			await callWindow.labelRingPeople.click();
			await expect(callWindow.checkboxRingPeople).not.toBeChecked();
			await expect(callWindow.textWillBeNotified).toBeHidden();
		});

		await callWindow.getBtnCall('user2').click();
		await expect(callWindow.getBtnMembers(1)).toBeVisible();

		await test.step('the callee is a member who was never asked to answer', async () => {
			await callWindow.getBtnMembers(1).click();
			await expect(callWindow.textNotInTheCall).toBeVisible();
			await expect(callWindow.getMemberStatus('Waiting for answer')).toBeVisible();
			// Nothing is ringing, so ringing them is something there is still to ask for.
			await expect(callWindow.getBtnRingMember('user2')).toBeVisible();
		});
	});

	// Qase case 15, and case 42's "the button announces itself".
	test('should ring the callee when the caller arrives, not when they click', async ({ page, browser }) => {
		const user2 = await openSessionAs(browser, Users.user2);

		await test.step('nothing is offered to the callee to begin with', async () => {
			await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeHidden();
		});

		await poHomeChannel.navbar.openChat('user2');

		const callWindow = await openCallWindow({ page, poHomeChannel });

		await test.step('the caller is still choosing, so nobody is ringing', async () => {
			await expect(callWindow.getPreflightHeading('Start conference with user2')).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeHidden();
		});

		await callWindow.getBtnCall('user2').click();

		await test.step("the caller entering the call is what rings the callee's phone", async () => {
			await expect(callWindow.getBtnMembers(1)).toBeVisible();
			await callWindow.getBtnMembers(1).click();
			await expect(callWindow.getMemberStatus('Ringing')).toBeVisible();
			// There is nothing left to ask of a phone that is already ringing.
			await expect(callWindow.getBtnRingMember('user2')).toHaveCount(0);
		});

		await test.step('and the callee is told without being taken over', async () => {
			// The ring opens the dropdown itself: nothing below clicked the button.
			await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.regionOngoingCalls).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.getCall('user1')).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.textRinging).toBeVisible();

			// Qase case 16: a ringing call is listed, not popped — no incoming popup and no backdrop over the app.
			await expect(user2.poHomeChannel.content.getVideoConfPopup('Incoming call from user1')).toHaveCount(0);
		});
	});

	// Qase case 17.
	test('should answer a ringing call through the join preflight', async ({ page, browser }) => {
		const user2 = await openSessionAs(browser, Users.user2);

		await poHomeChannel.navbar.openChat('user2');

		const callWindow = await openCallWindow({ page, poHomeChannel });
		await callWindow.getBtnCall('user2').click();
		await expect(callWindow.getBtnMembers(1)).toBeVisible();

		// Opened now and left open: the panel is what the steps below read the callee's standing off, and the
		// members button's own name changes as the count does.
		await callWindow.getBtnMembers(1).click();
		await expect(callWindow.panelTitle).toHaveText('People');

		await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeVisible();

		const calleeWindow = await joinFromList(user2, 'user1');

		await test.step('clicking the row opens a preflight rather than dropping them into the call', async () => {
			await expect(calleeWindow.page).toHaveURL(/\/conference\/[^/?]+$/);
			// The heading names the call, which for a direct call is the people on it — so this is deliberately
			// not pinned to a single name. See the report on Qase case 17.
			await expect(calleeWindow.getPreflightHeading(/^Join conference with /)).toBeVisible();
			await expect(calleeWindow.btnJoinCall).toBeVisible();
			await expect(calleeWindow.inputCallName).toHaveCount(0);
		});

		await calleeWindow.btnJoinCall.click();

		await test.step('confirming is what puts them in the call', async () => {
			await expect(calleeWindow.getBtnMembers(2)).toBeVisible();
			await expect(calleeWindow.frameProvider).toBeVisible();
		});

		await test.step("and the caller's People panel moves them into it", async () => {
			await expect(callWindow.getBtnMembers(2)).toBeVisible();
			await expect(callWindow.textInCall).toBeVisible();
			await expect(callWindow.getMemberStatus('Ringing')).toHaveCount(0);
			await expect(callWindow.textNotInTheCall).toHaveCount(0);
		});

		// Qase case 47: closing the window is the leave signal, and one member leaving is not the call ending.
		await test.step('closing the callee window is how the call is left', async () => {
			await calleeWindow.page.close();

			await expect(callWindow.getBtnMembers(1)).toBeVisible();
			await expect(callWindow.getMemberStatus('Left')).toBeVisible();
			await expect(callWindow.frameProvider).toBeVisible();
		});
	});

	// Qase case 18.
	test('should record a decline from the row without ending the call, and still allow joining', async ({ page, browser }) => {
		const user2 = await openSessionAs(browser, Users.user2);

		await poHomeChannel.navbar.openChat('user2');

		const callWindow = await openCallWindow({ page, poHomeChannel });
		await callWindow.getBtnCall('user2').click();
		await expect(callWindow.getBtnMembers(1)).toBeVisible();

		await expect(user2.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeVisible();
		await user2.poHomeChannel.ongoingCalls.ensureOpen();

		await test.step('declining keeps the row, saying what happened where its actions were', async () => {
			await user2.poHomeChannel.ongoingCalls.btnDecline.click();

			await expect(user2.poHomeChannel.ongoingCalls.getCall('user1')).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.textDeclined).toBeVisible();
			await expect(user2.poHomeChannel.ongoingCalls.btnDecline).toHaveCount(0);
			await expect(user2.poHomeChannel.ongoingCalls.textRinging).toHaveCount(0);
		});

		await test.step('the caller is told, and the call is still running', async () => {
			await callWindow.getBtnMembers(1).click();
			await expect(callWindow.textNotInTheCall).toBeVisible();
			await expect(callWindow.getMemberStatus('Declined')).toBeVisible();
			// Turned down is exactly when ringing back is the point.
			await expect(callWindow.getBtnRingMember('user2')).toBeVisible();
			await expect(callWindow.frameProvider).toBeVisible();
		});

		await test.step('and declining does not bar joining afterwards', async () => {
			const calleeWindow = await joinFromList(user2, 'user1');

			await expect(calleeWindow.btnJoinCall).toBeVisible();
			await calleeWindow.btnJoinCall.click();

			await expect(calleeWindow.getBtnMembers(2)).toBeVisible();
			await expect(callWindow.textInCall).toBeVisible();
			await expect(callWindow.getMemberStatus('Declined')).toHaveCount(0);
		});
	});

	// Qase cases 27, 30 and 52.
	test('should be a standalone window with one side panel at a time', async ({ api, page }) => {
		const channel = await createSharedChannel(api);
		const callName = `Layout ${faker.string.uuid()}`;

		const callWindow = await startNamedConference({ page, poHomeChannel }, channel, callName);

		await test.step('the window carries none of the app around the call', async () => {
			await expect(callWindow.appNavigation).toHaveCount(0);
			await expect(callWindow.frameProvider).toBeVisible();
		});

		await test.step('its own bar carries the timer, the name and exactly two controls', async () => {
			// What the clock reads is not pinned to a value — it is counting — only to being a clock reading a time.
			await expect(callWindow.timer).toHaveText(/\d{1,2}:\d{2}/);
			await expect(callWindow.topBar.getByText(callName)).toBeVisible();
			await expect(callWindow.topBar.getByRole('button')).toHaveCount(2);
		});

		await test.step('the members panel opens on its button', async () => {
			await callWindow.getBtnMembers(1).click();
			await expect(callWindow.panelTitle).toHaveText('People');
			await expect(callWindow.textInCall).toBeVisible();
		});

		await test.step('the chat panel replaces it in the same slot', async () => {
			await callWindow.btnChat.click();
			await expect(callWindow.getPanelTitle(`Chat in ${channel}`)).toBeVisible();
			// Never both: with persistent chat off the chat is simply the room the call started in, and it takes
			// the one slot there is.
			await expect(callWindow.textInCall).toHaveCount(0);
		});

		await test.step('the same button closes it again', async () => {
			await callWindow.btnChat.click();
			await expect(callWindow.panelTitle).toHaveCount(0);
		});

		await test.step('and so does the cross in the panel header', async () => {
			await callWindow.getBtnMembers(1).click();
			await expect(callWindow.panelTitle).toHaveText('People');
			await callWindow.btnClosePanel.click();
			await expect(callWindow.panelTitle).toHaveCount(0);
		});
	});

	// Qase cases 34 and 46.
	test('should reuse one call window, leaving the call it is in to join another', async ({ api, page, browser }) => {
		const firstChannel = await createSharedChannel(api, ['user1', 'user2', 'user3']);
		const secondChannel = await createSharedChannel(api, ['user1', 'user2', 'user3']);
		const firstCall = `First call ${faker.string.uuid()}`;
		const secondCall = `Second call ${faker.string.uuid()}`;

		const user2 = await openSessionAs(browser, Users.user2);
		const user3 = await openSessionAs(browser, Users.user3);

		// Two calls, each with somebody in it — a call nobody is in is not offered at all.
		await startNamedConference(user2, firstChannel, firstCall);
		await startNamedConference(user3, secondChannel, secondCall);

		await expect(poHomeChannel.ongoingCalls.btnOngoingCalls).toBeVisible({ timeout: 45_000 });

		const callWindow = await joinFromList({ page, poHomeChannel }, firstCall);
		await callWindow.btnJoinCall.click();
		await expect(callWindow.getBtnMembers(2)).toBeVisible();

		await test.step('the window is the shared one, and it keeps its opener', async () => {
			expect(await callWindow.page.evaluate(() => window.name)).toBe('rocketchat-conference');
			// `noopener` would sever the link that lets the main app report a leave the window could not.
			expect(await callWindow.page.evaluate(() => window.opener === null)).toBe(false);
		});

		await test.step('asking for the same conference again focuses it rather than stacking a second window', async () => {
			await poHomeChannel.ongoingCalls.ensureOpen();
			await poHomeChannel.ongoingCalls.getCall(firstCall).click();

			await expect(callWindow.topBar.getByText(firstCall)).toBeVisible();
			expect(page.context().pages()).toHaveLength(2);
		});

		await test.step('a different conference asks before taking the one they are in', async () => {
			await poHomeChannel.ongoingCalls.ensureOpen();
			await poHomeChannel.ongoingCalls.getCall(secondCall).click();

			const prompt = page.getByRole('dialog', { name: 'Leave the call you are in?' });
			await expect(prompt).toBeVisible();
			await expect(prompt).toContainText(firstCall);

			await prompt.getByRole('button', { name: 'Join', exact: true }).click();
		});

		await test.step('and the same window is navigated to it', async () => {
			await expect(callWindow.btnJoinCall).toBeVisible();
			await callWindow.btnJoinCall.click();

			await expect(callWindow.topBar.getByText(secondCall)).toBeVisible();
			expect(page.context().pages()).toHaveLength(2);
		});
	});

	// Qase cases 35, 36 and 37.
	test('should add participants from the call, ring them, and change no room doing it', async ({ api, page, browser }) => {
		const channel = await createSharedChannel(api);
		const callName = `Add people ${faker.string.uuid()}`;

		// Opened before the call, because a ring only reaches a client that is on screen.
		const user3 = await openSessionAs(browser, Users.user3);

		const callWindow = await startNamedConference({ page, poHomeChannel }, channel, callName);

		await callWindow.getBtnMembers(1).click();
		await callWindow.addPeople('user3');

		await test.step('an add rings, and a member who is not in the call is not counted as being in it', async () => {
			await expect(callWindow.textNotInTheCall).toBeVisible();
			await expect(callWindow.getMember('user3')).toBeVisible();
			await expect(callWindow.getMemberStatus('Ringing')).toBeVisible();
			await expect(callWindow.getBtnMembers(1)).toBeVisible();
		});

		await test.step('the ring reaches them', async () => {
			await expect(user3.poHomeChannel.ongoingCalls.btnOngoingCalls).toBeVisible();
			await user3.poHomeChannel.ongoingCalls.ensureOpen();
			await expect(user3.poHomeChannel.ongoingCalls.getCall(callName)).toBeVisible();
		});

		await test.step('and membership of the call is not membership of the room', async () => {
			expect(await isChannelMember(api, channel, 'user3')).toBe(false);
		});
	});

	// Qase case 63.
	test('should open nothing for a call URL that is not a web address', async ({ page }) => {
		// A `javascript:` or `data:` URL that ran would announce itself with an alert. Dismissed as well as
		// recorded: a dialog nobody answers holds the page.
		const dialogs: string[] = [];
		page.on('dialog', (dialog) => {
			dialogs.push(dialog.message());
			void dialog.dismiss();
		});

		const home = poHomeChannel;

		for (const callUrl of ['javascript:alert(document.domain)', 'data:text/html,<script>alert(1)</script>', '/admin/settings']) {
			await test.step(`refuses ${callUrl}`, async () => {
				await page.goto(`/conference/x?callUrl=${encodeURIComponent(callUrl)}`);

				// Nothing opened, so there is nothing to report either: claiming the popup was blocked would be a
				// lie with advice attached, since allowing popups cannot make this succeed.
				await expect(page.getByRole('dialog', { name: 'Open call in new tab' })).toHaveCount(0);
				await home.waitForHome();

				expect(page.context().pages()).toHaveLength(1);
				expect(dialogs).toEqual([]);
			});
		}
	});
});

/**
 * The other half of the setting's promise: with it off, the workspace is exactly what it was.
 *
 * `video-conference-ring.spec.ts` covers the ring itself. What is left, and is this file's business because it
 * only exists because of the flag, is that the ongoing-calls list is not there at all — and in particular that
 * the client does not poll `video-conference.joinable`, which a workspace with the flag off has no way to act on.
 */
test.describe('video conference call window disabled', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	// Explicit rather than left to the default: a run in which the describe above went first would otherwise
	// prove nothing.
	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'VideoConf_Conference_Window_Enabled', false);
	});

	// Qase case 7.
	test('should offer no ongoing-calls button and never ask for joinable calls', async ({ page, browser }) => {
		const joinableRequests: string[] = [];
		page.on('request', (request) => {
			if (request.url().includes('video-conference.joinable')) {
				joinableRequests.push(request.url());
			}
		});

		const poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.navbar.openChat('user2');

		const { page: auxPage } = await createAuxContext(browser, Users.user2);
		const auxPoHomeChannel = new HomeChannel(auxPage);

		try {
			await test.step('there is no video button in the navbar', async () => {
				await expect(poHomeChannel.ongoingCalls.btnOngoingCalls).toHaveCount(0);
			});

			await test.step('a ring is announced by the incoming popup, as it always was', async () => {
				await auxPoHomeChannel.navbar.openChat('user1');
				await auxPoHomeChannel.content.btnVideoCall.click();
				await auxPoHomeChannel.content.btnStartVideoCall.click();

				await expect(poHomeChannel.content.getVideoConfPopup('Incoming call from user2')).toBeVisible();
				await expect(poHomeChannel.ongoingCalls.btnOngoingCalls).toHaveCount(0);

				await poHomeChannel.content.btnDeclineVideoCall.click();
			});

			await test.step('and nothing ever asked the server for joinable calls', async () => {
				expect(joinableRequests).toEqual([]);
			});
		} finally {
			await auxPage.context().close();
		}
	});
});
