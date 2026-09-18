import { setTimeout as delay } from 'timers/promises';

import type { Credentials } from '@rocket.chat/api-client';
import type { App, IInternalMediaCallHistoryItem, IMediaCall, ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, afterEach, before, describe, it } from 'mocha';
import type { Collection } from 'mongodb';
import { MongoClient } from 'mongodb';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { appMediaCallEventsTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import {
	cleanupApps,
	entryValue,
	findAppLogItem,
	getAppLogs,
	getNewestAppLog,
	installLocalTestPackage,
	waitForNewAppLog,
} from '../../data/apps/helper';
import { MediaCallClient, placeAndAnswerCall, placeRingingCall } from '../../data/media-calls.helper';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { waitUntil } from '../../data/utils';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

/** Matches the modes the fixture app understands - see tests/data/apps/app-packages/README.md. */
type Mode = 'pass' | 'prevent' | 'prevent-i18n' | 'drop-screen-share';

/** What the fixture app ships for the key it names in `prevent-i18n` mode, per its `i18n/en.json`. */
const APP_PREVENTION_KEY = 'call_prevented_for_callee';
const appPreventionWording = (callee: string) => `Calls to ${callee} are not allowed by this workspace`;

/** The literal words the fixture app writes in plain `prevent` mode (no key). */
const APP_PREVENTION_REASON = 'blocked by media-call-events-test';

/** The app's name as its `app.json` spells it, which is what the prevention record snapshots. */
const APP_NAME = 'media call events test';

/** Long enough for the reported duration to round to something over zero. */
const MEASURABLE_CALL_MS = 1_100;

type TestParticipant = {
	user: TestUser<IUser>;
	credentials: Credentials;
	client: MediaCallClient;
};

const openParticipant = async (): Promise<TestParticipant> => {
	const user = await createUser();
	const userCredentials = await login(user.username, password);

	return { user, credentials: userCredentials, client: await MediaCallClient.open(userCredentials) };
};

/**
 * The newest history item of one user, in one direction.
 *
 * `call-history.list` answers for whoever calls it, so each side of a call needs its own
 * credentials: the admin credentials every other request here uses would report the admin's history.
 */
const getNewestCallHistoryItem = async (
	userCredentials: Credentials,
	direction: 'inbound' | 'outbound',
): Promise<IInternalMediaCallHistoryItem | undefined> => {
	const response = await request.get(api('call-history.list')).set(userCredentials).query({ direction, count: 1 }).expect(200);

	return response.body.items[0];
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
	userCredentials: Credentials,
	direction: 'inbound' | 'outbound',
	previousItemId?: string,
): Promise<RecordedCallHistoryItem> =>
	waitUntil(
		async () => {
			const newest = await getNewestCallHistoryItem(userCredentials, direction);

			return newest && newest._id !== previousItemId && newest.messageId ? (newest as RecordedCallHistoryItem) : undefined;
		},
		{ description: `a new ${direction} call history item carrying a message` },
	);

(IS_EE ? describe : describe.skip)('Apps > Media call events', function () {
	// Each test drives a whole call and then reads app logs written after the call ended, which is
	// several round trips past what the suite's default timeout allows for.
	this.timeout(90_000);

	let app: App;
	let caller: TestParticipant;
	let callee: TestParticipant;
	let connection: MongoClient;
	let mediaCalls: Collection<IMediaCall>;
	let screenSharingWasEnabled: ISetting['value'];

	/**
	 * Tells the fixture app how to answer the next `executePreMediaCallCreated`.
	 *
	 * The outcome is driven by this rather than by the callee's username because a call that fails
	 * because the callee was unreachable is refused the same way as one an app blocked - so the same
	 * user pair has to be able to run through both a passing and a prevented call.
	 */
	const setMode = async (mode: Mode): Promise<void> => {
		await request
			.post(apps(`/public/${app.id}/mode`))
			.set(credentials)
			.send({ mode })
			.expect(200);
	};

	const getCall = async (callId: IMediaCall['_id']): Promise<IMediaCall> => {
		const response = await request.get(api('media-calls.info')).set(caller.credentials).query({ callId }).expect(200);

		return response.body.call;
	};

	const getUnfinishedCalls = async (): Promise<IMediaCall[]> =>
		mediaCalls.find({ ended: false, uids: { $in: [caller.user._id, callee.user._id] } }).toArray();

	before((done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);
		mediaCalls = connection.db().collection<IMediaCall>('rocketchat_media_calls');

		// Set rather than assumed: `screen-share` only reaches the app's feature list while this is
		// on, and other specs turn it off for the length of their own run. The value it had is put
		// back in `after`, so this spec leaves the workspace as it found it.
		screenSharingWasEnabled = await getSettingValueById('VoIP_TeamCollab_Screen_Sharing_Enabled');
		await updateSetting('VoIP_TeamCollab_Screen_Sharing_Enabled', true);

		await cleanupApps();
		app = await installLocalTestPackage(appMediaCallEventsTest);

		[caller, callee] = await Promise.all([openParticipant(), openParticipant()]);
	});

	after(async () => {
		await Promise.all([caller?.client.close(), callee?.client.close()]);
		await cleanupApps();
		await Promise.all([caller && deleteUser(caller.user), callee && deleteUser(callee.user)]);
		await updateSetting('VoIP_TeamCollab_Screen_Sharing_Enabled', screenSharingWasEnabled);
		await connection.close();
	});

	/**
	 * A test that fails partway through can leave a call up, and a user already in a call cannot
	 * place another one - which would fail every test that follows it for an unrelated reason.
	 */
	afterEach(async () => {
		const unfinished = await getUnfinishedCalls();

		await Promise.all(unfinished.map((call) => caller.client.hangupCall(call._id)));

		await waitUntil(async () => (await getUnfinishedCalls()).length === 0 || undefined, {
			description: 'the test users to be left with no unfinished call',
		});
	});

	describe('pre-create decisions', () => {
		it('should prevent a call when the app returns prevent', async () => {
			await setMode('prevent');

			// Read before the call is placed: this pair of users accumulates history across the tests
			// below, and the item this test is about is the one that was not there yet.
			const [previousCallerItem, previousCalleeItem] = await Promise.all([
				getNewestCallHistoryItem(caller.credentials, 'outbound'),
				getNewestCallHistoryItem(callee.credentials, 'inbound'),
			]);
			const calleeSignalsFrom = callee.client.mark();

			const answer = await caller.client.requestCall(callee.user._id);

			// The one thing the prevented caller is told: the call it asked for is not happening.
			expect(answer).to.have.property('type', 'rejected-call-request');
			expect(answer).to.have.property('reason', 'prevented');

			expect(callee.client.signalsSince(calleeSignalsFrom).filter((signal) => signal.type === 'new')).to.have.lengthOf(0);

			const logs = await getAppLogs(app.id);
			const preCreated = findAppLogItem(logs, 'executePreMediaCallCreated', ['pre_created_mode', 'prevent']);

			expect(preCreated, 'executePreMediaCallCreated did not run in prevent mode').to.not.be.undefined;
			expect(entryValue(preCreated, 'pre_created_caller')).to.equal(caller.user.username);
			expect(entryValue(preCreated, 'pre_created_callee')).to.equal(callee.user.username);
			expect(entryValue(preCreated, 'pre_created_created_by')).to.equal(caller.user.username);
			// Two workspace users and no PBX in this workspace, so the call never leaves it
			expect(entryValue(preCreated, 'pre_created_origin')).to.equal('internal');

			// `contractId` is the per-session signing token; the host strips it on the way in.
			const contactKeys = entryValue(preCreated, 'pre_created_caller_keys')?.split(',');
			expect(contactKeys, 'the app did not report the keys of the contact it received').to.not.be.undefined;
			expect(contactKeys).to.not.include('contractId');
			expect(contactKeys).to.include('username');

			// Nobody's device rang, but the attempt got as far as routing, so the workspace writes it
			// down for the caller.
			const callerItem = await waitForNewCallHistoryItem(caller.credentials, 'outbound', previousCallerItem?._id);

			expect(callerItem.contactUsername).to.equal(callee.user.username);
			expect(callerItem.external).to.equal(false);
			// The call was never accepted and never activated, so there is nothing to time
			expect(callerItem.duration).to.equal(0);
			// An app refused the call before it existed; that state wins over every other one
			expect(callerItem.state).to.equal('prevented');

			// The callee's device never rang and they were never told, so nothing new appears in
			// their history - it stays exactly where it was before the call.
			const calleeNewest = await getNewestCallHistoryItem(callee.credentials, 'inbound');
			expect(calleeNewest?._id).to.equal(previousCalleeItem?._id);

			// Read by the id the history item names, so it is the message that record posted and not
			// one an earlier call left in this DM.
			const message = await request.get(api('chat.getMessage')).set(caller.credentials).query({ msgId: callerItem.messageId }).expect(200);
			const [{ rows }] = message.body.message.blocks;

			// The card title is the workspace's sentence; the second row carries the app's own words.
			expect(rows[0].elements[1]).to.have.nested.property('i18n.key', 'Voice_call_not_placed');
			expect(rows[1].elements[0]).to.have.property('text', APP_PREVENTION_REASON);
		});

		it('should keep the app wording of a call it prevented with an i18n key', async () => {
			await setMode('prevent-i18n');

			const previousCallerItem = await getNewestCallHistoryItem(caller.credentials, 'outbound');

			const answer = await caller.client.requestCall(callee.user._id);
			expect(answer).to.have.property('reason', 'prevented');

			const callerItem = await waitForNewCallHistoryItem(caller.credentials, 'outbound', previousCallerItem?._id);

			// Nothing reads `preventedBy` yet - no endpoint reports it and no view renders it - so the
			// collection is the only place the record can be observed from.
			const call = await mediaCalls.findOne({ _id: callerItem.callId });
			const { preventedBy } = call ?? {};

			expect(preventedBy, 'the prevented call carries no record of what refused it').to.not.be.undefined;
			expect(preventedBy?.appId).to.equal(app.id);
			expect(preventedBy?.appName).to.equal(APP_NAME);

			expect(preventedBy?.i18n, 'the record kept words instead of the key the app named').to.not.be.undefined;
			expect(preventedBy?.i18n?.key).to.equal(APP_PREVENTION_KEY);
			// Derivable from the app id today, stored anyway so the record still reads if that
			// convention ever changes
			expect(preventedBy?.i18n?.ns).to.equal(`app-${app.id}`);
			expect(preventedBy?.i18n?.args).to.deep.equal({ callee: callee.user.username });

			// The app's own `i18n/en.json` wording, which only the app knows, interpolated and stored:
			// it is the whole of what a reader gets once the app is uninstalled and takes its namespace
			// with it. A raw key here would be a snapshot that failed to resolve.
			expect(preventedBy?.text).to.equal(appPreventionWording(callee.user.username));
		});

		it('should drop screen-share when the app patches the requested features', async () => {
			await setMode('drop-screen-share');

			const previousStarted = await getNewestAppLog(app.id, 'executePostMediaCallStarted');

			const callId = await placeAndAnswerCall(caller.client, callee.client);

			const logs = await getAppLogs(app.id);
			const preCreated = findAppLogItem(logs, 'executePreMediaCallCreated', ['pre_created_mode', 'drop-screen-share']);

			expect(preCreated, 'executePreMediaCallCreated did not run in drop-screen-share mode').to.not.be.undefined;
			expect(entryValue(preCreated, 'pre_created_features')).to.contain('screen-share');

			// What the app patched out is what the workspace offers the two clients for the rest of
			// the call: the feature list on the call is the only place either side reads it from.
			const call = await getCall(callId);
			expect(call.features).to.not.include('screen-share');
			expect(call.features).to.include('audio');

			const started = await waitForNewAppLog(app.id, 'executePostMediaCallStarted', previousStarted?._id);
			expect(entryValue(started, 'post_started_features')).to.not.contain('screen-share');

			await callee.client.hangupCall(callId);
		});
	});

	describe('post events', () => {
		it('should notify the app when a call is answered and when media starts flowing', async () => {
			await setMode('pass');

			const [previousJoined, previousStarted] = await Promise.all([
				getNewestAppLog(app.id, 'executePostMediaCallParticipantJoined'),
				getNewestAppLog(app.id, 'executePostMediaCallStarted'),
			]);

			const callId = await placeAndAnswerCall(caller.client, callee.client);

			const joined = await waitForNewAppLog(app.id, 'executePostMediaCallParticipantJoined', previousJoined?._id);

			expect(entryValue(joined, 'post_joined_call')).to.equal(callId);
			expect(entryValue(joined, 'post_joined_participant')).to.equal(callee.user.username);
			expect(entryValue(joined, 'post_joined_accepted_at')).to.be.a('string');
			expect(entryValue(joined, 'post_joined_participant_keys')?.split(',')).to.not.include('contractId');

			const started = await waitForNewAppLog(app.id, 'executePostMediaCallStarted', previousStarted?._id);

			expect(entryValue(started, 'post_started_call')).to.equal(callId);
			expect(entryValue(started, 'post_started_state')).to.equal('active');
			expect(entryValue(started, 'post_started_activated_at')).to.be.a('string');
			// The pre context reported the same origin for this pair of users
			expect(entryValue(started, 'post_started_origin')).to.equal('internal');
			// The counterpart of the patched call above: with the feature left alone, it is offered
			expect(entryValue(started, 'post_started_features')).to.contain('screen-share');

			await callee.client.hangupCall(callId);
		});

		it('should notify the app when a call ends, with who ended it and how long it ran', async () => {
			await setMode('pass');

			const previousEnded = await getNewestAppLog(app.id, 'executePostMediaCallEnded');

			const callId = await placeAndAnswerCall(caller.client, callee.client);

			// The reported duration is measured from the moment the call was activated, which
			// `placeAndAnswerCall` has already waited for, so this wait is the whole of it.
			await delay(MEASURABLE_CALL_MS);

			await callee.client.hangupCall(callId);

			const ended = await waitForNewAppLog(app.id, 'executePostMediaCallEnded', previousEnded?._id);

			expect(entryValue(ended, 'post_ended_call')).to.equal(callId);
			expect(entryValue(ended, 'post_ended_ended')).to.equal('true');
			expect(entryValue(ended, 'post_ended_at')).to.be.a('string');
			expect(entryValue(ended, 'post_ended_by_type')).to.equal('user');
			expect(Number(entryValue(ended, 'post_ended_duration_ms'))).to.be.greaterThan(0);

			expect(entryValue(ended, 'post_ended_outcome')).to.equal('answered');
			// Logged only inside the `isAnsweredCall` branch, so its presence is the guard firing.
			expect(entryValue(ended, 'post_ended_accepted_at')).to.be.a('string');
		});
	});

	/**
	 * There is no event for a call nobody answered - an app has to read the outcome off the end
	 * event. These drive the three outcomes through the real signaling, because the thing worth
	 * proving is that a declined call and an unanswered one do not look alike to an app.
	 */
	describe('missed and rejected calls', () => {
		it('should read a call the callee declined as rejected, not as missed', async () => {
			await setMode('pass');

			const previousEnded = await getNewestAppLog(app.id, 'executePostMediaCallEnded');

			const callId = await placeRingingCall(caller.client, callee.client);

			await callee.client.rejectCall(callId);

			const ended = await waitForNewAppLog(app.id, 'executePostMediaCallEnded', previousEnded?._id);

			expect(entryValue(ended, 'post_ended_outcome')).to.equal('rejected');
			expect(entryValue(ended, 'post_ended_reason')).to.equal('rejected');
			expect(entryValue(ended, 'post_ended_duration_ms')).to.equal('0');
			// The answered branch never ran, so the guard did not narrow the wrong way.
			expect(entryValue(ended, 'post_ended_accepted_at')).to.be.undefined;
		});

		it('should read a call nobody answered as missed', async () => {
			await setMode('pass');

			const previousEnded = await getNewestAppLog(app.id, 'executePostMediaCallEnded');

			const callId = await placeRingingCall(caller.client, callee.client);

			// The caller gives up while it is still ringing. Waiting out the real ring timeout would
			// take longer than a test should, and the callee misses the call either way.
			await caller.client.hangupCall(callId);

			const ended = await waitForNewAppLog(app.id, 'executePostMediaCallEnded', previousEnded?._id);

			expect(entryValue(ended, 'post_ended_outcome')).to.equal('missed');
			expect(entryValue(ended, 'post_ended_reason')).to.not.equal('rejected');
			expect(entryValue(ended, 'post_ended_duration_ms')).to.equal('0');
			expect(entryValue(ended, 'post_ended_accepted_at')).to.be.undefined;
		});

		it('should name every reason it reports, and place every call in one outcome', async () => {
			const logs = await getAppLogs(app.id);
			const ended = logs.filter((log) => log.method.includes('executePostMediaCallEnded'));

			expect(ended.length, 'no call ended during this run').to.be.greaterThan(0);

			for (const log of ended) {
				// `unreachable` means the three guards failed to partition an ended call.
				expect(entryValue(log, 'post_ended_outcome')).to.not.equal('unreachable');

				// A reason the SDK cannot name means MediaCallHangupReason has drifted from the
				// server. Calls that recorded no reason at all have nothing to check.
				if (entryValue(log, 'post_ended_reason') !== 'none') {
					expect(entryValue(log, 'post_ended_reason_known'), `unnamed reason: ${entryValue(log, 'post_ended_reason')}`).to.equal('true');
				}
			}
		});
	});
});
