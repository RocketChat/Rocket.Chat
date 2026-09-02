import type { APIRequestContext, Page } from '@playwright/test';
import type { CallPreventionRecord, IInternalMediaCallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';
import { MongoClient } from 'mongodb';

import { appMediaCallEventsTest } from '../../data/apps/app-packages';
import { DEFAULT_USER_CREDENTIALS, IS_EE, URL_MONGODB } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { getSettingValueById, setSettingValueById } from '../utils';
import {
	findAppLogItem,
	getAppLogValue,
	getAppLogs,
	getNewestAppLog,
	installLocalTestPackage,
	uninstallApp,
	waitForNewAppLog,
} from '../utils/apps';
import type { BaseTest } from '../utils/test';
import { expect, test } from '../utils/test';

/** Matches the modes the fixture app understands - see tests/data/apps/app-packages/README.md. */
type Mode = 'pass' | 'prevent' | 'prevent-i18n' | 'drop-screen-share';

/** What the fixture app ships for the key it names in `prevent-i18n` mode, per its `i18n/en.json`. */
const APP_PREVENTION_KEY = 'call_prevented_for_callee';
const APP_PREVENTION_WORDING = 'Calls to user2 are not allowed by this workspace';

/** The literal words the fixture app writes in plain `prevent` mode (no key). */
const APP_PREVENTION_REASON = 'blocked by media-call-events-test';

/** The prevention record of an app that named a key rather than writing the words itself. */
type I18nPreventionRecord = Extract<CallPreventionRecord, { key: string }>;

/** `entries[].args[1]` for a label, within a single already-located log group. */
const entryValue = (log: { entries: { args: string[] }[] } | undefined, label: string): string | undefined =>
	log?.entries.find((entry) => entry.args[0] === label)?.args[1];

/** Which side of the call one user's history is being read from, and who the other party is. */
type HistoryQuery = { direction: 'inbound' | 'outbound'; filter: string };

/**
 * The newest history item of one user, for calls with one other user.
 *
 * `call-history.list` answers for whoever calls it, so each side of a call needs its own request
 * context: the admin context every other assertion here uses would report the admin's own history.
 */
const getNewestCallHistoryItem = async (
	userApi: APIRequestContext,
	query: HistoryQuery,
): Promise<IInternalMediaCallHistoryItem | undefined> => {
	const response = await userApi.get('/api/v1/call-history.list', { params: { ...query, count: 1 } });

	await expect(response).toBeOK();

	const { items } = await response.json();

	return items[0];
};

/** A history item that has finished being recorded, and so names the message it posted. */
type RecordedCallHistoryItem = IInternalMediaCallHistoryItem & { messageId: string };

/**
 * Waits for a user to have a history item they did not have before, and returns it.
 *
 * An item is only read once it names the message it posted: the message id is written in a second
 * update right after the item itself, so an item without one has not finished being recorded.
 */
const waitForNewCallHistoryItem = async (
	userApi: APIRequestContext,
	query: HistoryQuery,
	previousItemId?: string,
): Promise<RecordedCallHistoryItem> => {
	let found: RecordedCallHistoryItem | undefined;

	await expect
		.poll(
			async () => {
				const newest = await getNewestCallHistoryItem(userApi, query);

				if (!newest || newest._id === previousItemId || !newest.messageId) {
					return false;
				}

				found = newest as RecordedCallHistoryItem;
				return true;
			},
			{
				message: `Timed out waiting for a new ${query.direction} call history item carrying a message`,
				timeout: 20_000,
			},
		)
		.toBe(true);

	return found as RecordedCallHistoryItem;
};

/**
 * A call an app refused, read from the database.
 *
 * Nothing reads `preventedBy` yet - no endpoint reports it and no view renders it - so the
 * collection is the only place the record can be observed from. Scoped to the fixture app, so a
 * record another app or another spec left behind is never mistaken for this one.
 */
const getNewestPreventedCall = async (connection: MongoClient, appId: string): Promise<IMediaCall | null> =>
	connection
		.db()
		.collection<IMediaCall>('rocketchat_media_calls')
		.findOne({ 'preventedBy.appId': appId } as Filter<IMediaCall>, { sort: { createdAt: -1 } });

/** Waits for the app to refuse a call it had not refused before, and returns the record of it. */
const waitForNewPreventedCall = async (connection: MongoClient, appId: string, previousCallId?: string): Promise<IMediaCall> => {
	let found: IMediaCall | undefined;

	await expect
		.poll(
			async () => {
				const newest = await getNewestPreventedCall(connection, appId);

				if (!newest || newest._id === previousCallId) {
					return false;
				}

				found = newest;
				return true;
			},
			{ message: 'Timed out waiting for the app to refuse a call', timeout: 20_000 },
		)
		.toBe(true);

	return found as IMediaCall;
};

/**
 * Split into two serial groups on purpose: within a group the tests share one pair of calls'
 * worth of state and have to run in order, but a failure in one group must not skip the other.
 */
test.describe('Apps > Media call events', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let appId: string;
	let sessions: { page: Page; poHomeChannel: HomeChannel }[];
	let screenSharingWasEnabled: unknown;
	/** One request context per user, for the endpoints that answer for the caller alone. */
	let userApis: Record<'user1' | 'user2', APIRequestContext>;
	let connection: MongoClient;

	/**
	 * Tells the fixture app how to answer the next `executePreMediaCallCreated`.
	 *
	 * The outcome is driven by this rather than by the callee's username because a call that fails
	 * because the callee was unreachable looks identical in the UI to one an app blocked - so the
	 * same user pair has to be able to run through both a passing and a prevented call.
	 */
	const setMode = async (api: BaseTest['api'], mode: Mode): Promise<void> => {
		const response = await api.post(`/apps/public/${appId}/mode`, { mode }, '/api');

		await expect(response).toBeOK();
	};

	/** Places a call from user1 to user2 and has user2 answer it. */
	const placeAndAnswerCall = async (): Promise<void> => {
		const [user1, user2] = sessions;

		await user1.poHomeChannel.navbar.openChat('user2');
		await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

		await user1.poHomeChannel.content.btnVoiceCall.click();
		await user1.poHomeChannel.voiceCalls.widget.initiateCall();
		await user2.poHomeChannel.voiceCalls.widget.acceptCall();
	};

	test.beforeAll(async ({ api }) => {
		connection = await MongoClient.connect(URL_MONGODB);

		// Set rather than assumed: `screen-share` only reaches the app's feature list while this is
		// on, and other specs turn it off for the length of their own run. The value it had is put
		// back in `afterAll`, so this spec leaves the workspace as it found it.
		screenSharingWasEnabled = await getSettingValueById(api, 'VoIP_TeamCollab_Screen_Sharing_Enabled');
		await setSettingValueById(api, 'VoIP_TeamCollab_Screen_Sharing_Enabled', true);

		const result = await installLocalTestPackage(appMediaCallEventsTest);
		appId = result.app.id;

		await Promise.all([
			api.post('/users.setStatus', { status: 'online', username: 'user1' }),
			api.post('/users.setStatus', { status: 'online', username: 'user2' }),
		]);

		const [user1Api, user2Api] = await Promise.all([
			api.login({ username: 'user1', password: DEFAULT_USER_CREDENTIALS.password }),
			api.login({ username: 'user2', password: DEFAULT_USER_CREDENTIALS.password }),
		]);

		userApis = { user1: user1Api, user2: user2Api };
	});

	test.beforeAll(async ({ browser }) => {
		sessions = await Promise.all([
			createAuxContext(browser, Users.user1).then(({ page }) => ({ page, poHomeChannel: new HomeChannel(page) })),
			createAuxContext(browser, Users.user2).then(({ page }) => ({ page, poHomeChannel: new HomeChannel(page) })),
		]);
	});

	/**
	 * A test that fails partway through can leave a call up, and a user already in a call cannot
	 * place another one - which would fail every test that follows it for an unrelated reason.
	 * The groups no longer skip each other on failure, so the state has to be cleaned up for real.
	 */
	test.afterEach(async () => {
		for (const { poHomeChannel } of sessions) {
			const { widget } = poHomeChannel.voiceCalls;
			const { controls } = widget;

			for (const button of [controls.hangup, controls.cancel, controls.reject]) {
				if (await button.isVisible()) {
					// The opposite side's widget may be closing at this very moment; cleanup must not
					// turn a passing test into a failing one
					await button.click({ timeout: 5000 }).catch(() => undefined);
					break;
				}
			}

			// A refused call leaves the widget up on the dialer it was opened with, and the next test
			// cannot open a fresh one over it
			if (await widget.content.isVisible()) {
				await widget.btnClose.click({ timeout: 5000 }).catch(() => undefined);
			}
		}
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(sessions.map(({ page }) => page.close()));
		await uninstallApp(appId);
		await setSettingValueById(api, 'VoIP_TeamCollab_Screen_Sharing_Enabled', screenSharingWasEnabled);
		await connection.close();
	});

	test.describe.serial('pre-create decisions', () => {
		test('should prevent a call when the app returns prevent', async ({ api }) => {
			const [user1, user2] = sessions;

			await setMode(api, 'prevent');

			// Read before the call is placed: this pair of users has a history of earlier runs, and the
			// item this test is about is the one that was not there yet.
			const [previousCallerItem, previousCalleeItem] = await Promise.all([
				getNewestCallHistoryItem(userApis.user1, { direction: 'outbound', filter: 'user2' }),
				getNewestCallHistoryItem(userApis.user2, { direction: 'inbound', filter: 'user1' }),
			]);

			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

			await user1.poHomeChannel.content.btnVoiceCall.click();
			await expect(user1.poHomeChannel.voiceCalls.widget.content).toBeVisible();

			// The end-of-call tone is played through a detached `new Audio()`, which never enters the
			// DOM and so cannot be located - so the caller's page records every sound that is played,
			// by its id. Installed before the call is placed, cleared each run.
			await user1.page.evaluate(() => {
				const w = window as unknown as { __playedSounds?: string[]; __soundSpyInstalled?: boolean };
				w.__playedSounds = [];
				if (w.__soundSpyInstalled) {
					return;
				}
				w.__soundSpyInstalled = true;

				const { play } = window.HTMLMediaElement.prototype;
				window.HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
					(w.__playedSounds ??= []).push(this.id);
					return play.apply(this);
				};
			});

			// Deliberately not `widget.initiateCall()`: that helper asserts the call starts ringing,
			// which is exactly what must not happen here.
			await user1.poHomeChannel.voiceCalls.widget.controls.call.click();

			await test.step('the call never starts and the callee is never rung', async () => {
				// The widget stays up on the dialer it was opened with, so the state to read is the
				// controls: a call that started would offer `Cancel` instead of `Call`.
				await expect(user1.poHomeChannel.voiceCalls.widget.controls.cancel).not.toBeVisible();
				await expect(user1.poHomeChannel.voiceCalls.widget.controls.call).toBeVisible();
				await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			});

			await test.step('the caller hears the end-of-call tone', async () => {
				// The one cue the prevented caller gets: the same tone every ended call plays. `call-ended`
				// is the id `CustomSoundProvider` gives that sound.
				await expect
					.poll(() => user1.page.evaluate(() => (window as unknown as { __playedSounds?: string[] }).__playedSounds ?? []), {
						message: 'the caller never heard the end-of-call tone after the call was prevented',
						timeout: 10_000,
					})
					.toContain('call-ended');
			});

			await test.step('the app ran and saw the call it blocked', async () => {
				const { logs } = await getAppLogs(api, appId);

				const preCreated = findAppLogItem(logs, 'executePreMediaCallCreated', ['pre_created_mode', 'prevent']);
				expect(preCreated, 'executePreMediaCallCreated did not run in prevent mode').toBeTruthy();

				expect(entryValue(preCreated, 'pre_created_caller')).toBe('user1');
				expect(entryValue(preCreated, 'pre_created_callee')).toBe('user2');
				expect(entryValue(preCreated, 'pre_created_created_by')).toBe('user1');
				// Two workspace users and no PBX in this workspace, so the call never leaves it
				expect(entryValue(preCreated, 'pre_created_origin')).toBe('internal');
			});

			await test.step('the contact handed to the app carries no session credential', async () => {
				const { logs } = await getAppLogs(api, appId);
				const keys = getAppLogValue(logs, 'executePreMediaCallCreated', 'pre_created_caller_keys')?.split(',');

				expect(keys, 'the app did not report the keys of the contact it received').toBeTruthy();
				// `contractId` is the per-session signing token; the host strips it on the way in.
				expect(keys).not.toContain('contractId');
				expect(keys).toContain('username');
			});

			// Nobody's device rang, but the attempt got as far as routing, so the workspace writes it
			// down for the caller. A prevented internal call leaves a caller-only entry (spec §3).
			const callerItem = await waitForNewCallHistoryItem(
				userApis.user1,
				{ direction: 'outbound', filter: 'user2' },
				previousCallerItem?._id,
			);

			await test.step('only the caller keeps a record of the call that never happened', async () => {
				expect(callerItem.contactUsername).toBe('user2');
				expect(callerItem.external).toBe(false);
				// The call was never accepted and never activated, so there is nothing to time
				expect(callerItem.duration).toBe(0);
				// An app refused the call before it existed; that state wins over every other one
				expect(callerItem.state).toBe('prevented');

				// The callee's device never rang and they were never told, so nothing new appears in
				// their history - it stays exactly where it was before the call (spec §3).
				const calleeNewest = await getNewestCallHistoryItem(userApis.user2, { direction: 'inbound', filter: 'user1' });
				expect(calleeNewest?._id).toBe(previousCalleeItem?._id);
			});

			await test.step('the record posts the prevented card into the DM', async () => {
				// Read by the id the history item names, so it is the message that record posted and not
				// one an earlier call left in this DM.
				const message = user1.poHomeChannel.content.messageById(callerItem.messageId);

				// The card title is the workspace's sentence; the second line carries the app's own words.
				await expect(message).toContainText('Voice call not placed');
				await expect(message).toContainText(APP_PREVENTION_REASON);
			});
		});

		test('should keep the app wording of a call it prevented with an i18n key', async ({ api }) => {
			const [user1, user2] = sessions;

			await setMode(api, 'prevent-i18n');

			const previousPreventedCall = await getNewestPreventedCall(connection, appId);

			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

			await user1.poHomeChannel.content.btnVoiceCall.click();
			await expect(user1.poHomeChannel.voiceCalls.widget.content).toBeVisible();
			await user1.poHomeChannel.voiceCalls.widget.controls.call.click();

			await test.step('the call never starts and the callee is never rung', async () => {
				await expect(user1.poHomeChannel.voiceCalls.widget.controls.cancel).not.toBeVisible();
				await expect(user1.poHomeChannel.voiceCalls.widget.controls.call).toBeVisible();
				await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			});

			const call = await waitForNewPreventedCall(connection, appId, previousPreventedCall?._id);
			const preventedBy = call.preventedBy as I18nPreventionRecord | undefined;

			await test.step('the record names the key and where it resolves', () => {
				expect(preventedBy, 'the prevented call carries no record of what refused it').toBeTruthy();
				expect(preventedBy && 'key' in preventedBy, 'the record kept words instead of the key the app named').toBe(true);

				expect(preventedBy?.appId).toBe(appId);
				expect(preventedBy?.appName).toBe('media call events test');
				expect(preventedBy?.key).toBe(APP_PREVENTION_KEY);
				// Derivable from the app id today, stored anyway so the record still reads if that
				// convention ever changes
				expect(preventedBy?.ns).toBe(`app-${appId}`);
				expect(preventedBy?.args).toEqual({ callee: 'user2' });
			});

			await test.step('the app wording is snapshotted with its arguments applied', () => {
				// The app's own `i18n/en.json` wording, which only the app knows, interpolated and
				// stored: it is the whole of what a reader gets once the app is uninstalled and takes
				// its namespace with it. A raw key here would be a snapshot that failed to resolve.
				expect(preventedBy?.text).toBe(APP_PREVENTION_WORDING);
			});
		});

		test('should drop screen-share when the app patches the requested features', async ({ api }) => {
			const [user1, user2] = sessions;

			await setMode(api, 'drop-screen-share');

			const previousStarted = await getNewestAppLog(api, appId, 'executePostMediaCallStarted');

			await placeAndAnswerCall();

			await test.step('the app was offered screen-share before patching it out', async () => {
				const { logs } = await getAppLogs(api, appId);
				const preCreated = findAppLogItem(logs, 'executePreMediaCallCreated', ['pre_created_mode', 'drop-screen-share']);

				expect(preCreated, 'executePreMediaCallCreated did not run in drop-screen-share mode').toBeTruthy();
				expect(entryValue(preCreated, 'pre_created_features')).toContain('screen-share');
			});

			await test.step('neither side is offered screen sharing', async () => {
				// The caller is looking at the DM the call is in, and an ongoing call takes that room
				// over: the room view registers itself and the widget stops rendering. So the caller's
				// controls are the room section's, and the callee - who is not in the room - keeps the
				// widget. Each side is read where its controls actually are.
				const callerControls = user1.poHomeChannel.voiceCalls.roomSection.controls;
				const calleeControls = user2.poHomeChannel.voiceCalls.widget.controls;

				// The end-call button is read first on both sides: it is always offered, so its presence
				// is what makes the absence of the screen-share button mean anything.
				await expect(callerControls.hangup).toBeVisible();
				await expect(callerControls.shareScreen).not.toBeVisible();

				await expect(calleeControls.hangup).toBeVisible();
				await expect(calleeControls.shareScreen).not.toBeVisible();
			});

			await test.step('the call the app saw kept the patched feature list', async () => {
				const started = await waitForNewAppLog(api, appId, 'executePostMediaCallStarted', previousStarted?._id);

				expect(entryValue(started, 'post_started_features')).not.toContain('screen-share');
			});

			await user2.poHomeChannel.voiceCalls.widget.hangup();
		});
	});

	test.describe.serial('post events', () => {
		test('should notify the app when a call is answered and when media starts flowing', async ({ api }) => {
			const [user1, user2] = sessions;

			await setMode(api, 'pass');

			const previousJoined = await getNewestAppLog(api, appId, 'executePostMediaCallParticipantJoined');
			const previousStarted = await getNewestAppLog(api, appId, 'executePostMediaCallStarted');

			await placeAndAnswerCall();

			await test.step('executePostMediaCallParticipantJoined receives the callee', async () => {
				const joined = await waitForNewAppLog(api, appId, 'executePostMediaCallParticipantJoined', previousJoined?._id);

				expect(entryValue(joined, 'post_joined_participant')).toBe('user2');
				expect(entryValue(joined, 'post_joined_accepted_at')).toBeTruthy();
				expect(entryValue(joined, 'post_joined_call')).toBeTruthy();
				expect(entryValue(joined, 'post_joined_participant_keys')?.split(',')).not.toContain('contractId');
			});

			await test.step('both sides are offered screen sharing when no app patched it out', async () => {
				// The counterpart of the patched call above: with the feature left alone, the control is
				// there, on the same two surfaces.
				await expect(user1.poHomeChannel.voiceCalls.roomSection.controls.shareScreen).toBeVisible();
				await expect(user2.poHomeChannel.voiceCalls.widget.controls.shareScreen).toBeVisible();
			});

			await test.step('executePostMediaCallStarted receives an active call', async () => {
				const started = await waitForNewAppLog(api, appId, 'executePostMediaCallStarted', previousStarted?._id);

				expect(entryValue(started, 'post_started_call')).toBeTruthy();
				expect(entryValue(started, 'post_started_state')).toBe('active');
				expect(entryValue(started, 'post_started_activated_at')).toBeTruthy();
				// The pre context reported the same origin for this pair of users
				expect(entryValue(started, 'post_started_origin')).toBe('internal');
				expect(entryValue(started, 'post_started_features')).toContain('screen-share');
			});

			await user2.poHomeChannel.voiceCalls.widget.hangup();
		});

		test('should notify the app when a call ends, with who ended it and how long it ran', async ({ api }) => {
			const [, user2] = sessions;

			await setMode(api, 'pass');

			const previousEnded = await getNewestAppLog(api, appId, 'executePostMediaCallEnded');
			const previousStarted = await getNewestAppLog(api, appId, 'executePostMediaCallStarted');

			await placeAndAnswerCall();

			// Wait for the call to be active and to have run for a measurable amount of time, so the
			// reported duration is deterministically greater than zero.
			await waitForNewAppLog(api, appId, 'executePostMediaCallStarted', previousStarted?._id);
			await expect.poll(() => user2.poHomeChannel.voiceCalls.widget.getTimerContentInSeconds()).toBeGreaterThanOrEqual(1);

			await user2.poHomeChannel.voiceCalls.widget.hangup();

			const ended = await waitForNewAppLog(api, appId, 'executePostMediaCallEnded', previousEnded?._id);

			expect(entryValue(ended, 'post_ended_call')).toBeTruthy();
			expect(entryValue(ended, 'post_ended_ended')).toBe('true');
			expect(entryValue(ended, 'post_ended_at')).toBeTruthy();
			expect(entryValue(ended, 'post_ended_by_type')).toBe('user');
			expect(Number(entryValue(ended, 'post_ended_duration_ms'))).toBeGreaterThan(0);

			await test.step('the app reads the call as answered', async () => {
				expect(entryValue(ended, 'post_ended_outcome')).toBe('answered');
				// Logged only inside the `isAnsweredCall` branch, so its presence is the guard firing.
				expect(entryValue(ended, 'post_ended_accepted_at')).toBeTruthy();
			});
		});
	});

	/**
	 * There is no event for a call nobody answered - an app has to read the outcome off the
	 * end event. These drive the three outcomes through the real UI, because the thing worth
	 * proving is that a declined call and an unanswered one do not look alike to an app.
	 */
	test.describe.serial('missed and rejected calls', () => {
		test('should read a call the callee declined as rejected, not as missed', async ({ api }) => {
			const [user1, user2] = sessions;

			await setMode(api, 'pass');

			const previousEnded = await getNewestAppLog(api, appId, 'executePostMediaCallEnded');

			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();

			// While ringing, the callee's button reads `Reject` rather than `End call`.
			await expect(user2.poHomeChannel.voiceCalls.widget.controls.reject).toBeVisible();
			await user2.poHomeChannel.voiceCalls.widget.reject();

			const ended = await waitForNewAppLog(api, appId, 'executePostMediaCallEnded', previousEnded?._id);

			expect(entryValue(ended, 'post_ended_outcome')).toBe('rejected');
			expect(entryValue(ended, 'post_ended_reason')).toBe('rejected');
			expect(entryValue(ended, 'post_ended_duration_ms')).toBe('0');
			// The answered branch never ran, so the guard did not narrow the wrong way.
			expect(entryValue(ended, 'post_ended_accepted_at')).toBeUndefined();
		});

		test('should read a call nobody answered as missed', async ({ api }) => {
			const [user1, user2] = sessions;

			await setMode(api, 'pass');

			const previousEnded = await getNewestAppLog(api, appId, 'executePostMediaCallEnded');

			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();

			// The caller gives up while it is still ringing. Waiting out the real ring timeout
			// would take longer than a test should, and the callee misses the call either way.
			await expect(user2.poHomeChannel.voiceCalls.widget.content).toBeVisible();
			await user1.poHomeChannel.voiceCalls.widget.controls.cancel.click();

			const ended = await waitForNewAppLog(api, appId, 'executePostMediaCallEnded', previousEnded?._id);

			expect(entryValue(ended, 'post_ended_outcome')).toBe('missed');
			expect(entryValue(ended, 'post_ended_reason')).not.toBe('rejected');
			expect(entryValue(ended, 'post_ended_duration_ms')).toBe('0');
			expect(entryValue(ended, 'post_ended_accepted_at')).toBeUndefined();
		});

		test('should name every reason it reports, and place every call in one outcome', async ({ api }) => {
			const { logs } = await getAppLogs(api, appId);
			const ended = logs.filter((log) => log.method.includes('executePostMediaCallEnded'));

			expect(ended.length, 'no call ended during this run').toBeGreaterThan(0);

			for (const log of ended) {
				// `unreachable` means the three guards failed to partition an ended call.
				expect(entryValue(log, 'post_ended_outcome')).not.toBe('unreachable');

				// A reason the SDK cannot name means MediaCallHangupReason has drifted from the
				// server. Calls that recorded no reason at all have nothing to check.
				if (entryValue(log, 'post_ended_reason') !== 'none') {
					expect(entryValue(log, 'post_ended_reason_known'), `unnamed reason: ${entryValue(log, 'post_ended_reason')}`).toBe('true');
				}
			}
		});
	});
});
