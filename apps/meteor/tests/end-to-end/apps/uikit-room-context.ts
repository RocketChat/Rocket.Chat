import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appUiKitRoomTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { IS_EE } from '../../e2e/config/constants';

const roomId = 'GENERAL';

(IS_EE ? describe : describe.skip)('Apps - UIKit Room Context in Modal Interactions', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installLocalTestPackage(appUiKitRoomTest);
	});

	after(() => cleanupApps());

	const sendUiKitInteraction = (type: string, payload: Record<string, unknown>) =>
		request
			.post(`/api/apps/ui.interaction/${app.id}`)
			.set(credentials)
			.send({
				type,
				...payload,
			});

	const getAppLogs = () => request.get(apps(`/${app.id}/logs`)).set(credentials);

	/**
	 * Find a log entry by handler method name and first log argument.
	 * Each app logger.debug call creates a log entry with args[0] as the label and args[1] as the value.
	 */
	const findLogEntry = (logs: ILoggerStorageEntry[], methodFragment: string, firstArg: string) =>
		logs.find(
			(log) =>
				String(log.method).includes(methodFragment) && log.entries.some((entry) => Array.isArray(entry.args) && entry.args[0] === firstArg),
		);

	it('should include room data in executeBlockActionHandler when rid is sent', async () => {
		const viewId = `test-view-id-${Date.now()}`;

		const interactionRes = await sendUiKitInteraction('blockAction', {
			actionId: 'test_button',
			triggerId: `test-trigger-${Date.now()}`,
			rid: roomId,
			container: {
				type: 'view',
				id: viewId,
			},
			payload: {
				blockId: 'test_block',
				value: 'test_value',
			},
		});

		expect(interactionRes.status, 'blockAction interaction failed').to.equal(200);

		const logsRes = await getAppLogs();

		expect(logsRes.status, 'Fetching app logs failed').to.equal(200);
		expect(logsRes.body).to.have.a.property('success', true);
		expect(logsRes.body.logs).to.be.an('array').with.lengthOf.greaterThan(0);

		const blockActionLog = findLogEntry(logsRes.body.logs, 'executeBlockActionHandler', 'block_action_room');

		expect(blockActionLog, 'Block action handler log not found').to.exist;

		const roomEntry = blockActionLog?.entries.find((entry) => Array.isArray(entry.args) && entry.args[0] === 'block_action_room');

		expect(roomEntry, 'Room log entry not found in block action handler').to.exist;

		// The second arg is data.room.id (the room id string) when room is present
		expect(roomEntry?.args[1], 'Room id should match the sent rid').to.equal(roomId);
	});

	it('should include room data in executeViewSubmitHandler when rid is sent', async () => {
		const viewId = `test-view-id-${Date.now()}`;

		const interactionRes = await sendUiKitInteraction('viewSubmit', {
			actionId: 'test_button',
			triggerId: `test-trigger-${Date.now()}`,
			rid: roomId,
			viewId,
			payload: {
				view: {
					id: viewId,
					type: 'modal',
					appId: app.id,
					title: { type: 'plain_text', text: 'Test Modal' },
					blocks: [],
					state: {},
				},
			},
		});

		expect(interactionRes.status, 'viewSubmit interaction failed').to.equal(200);

		const logsRes = await getAppLogs();

		expect(logsRes.status, 'Fetching app logs failed').to.equal(200);
		expect(logsRes.body).to.have.a.property('success', true);

		const viewSubmitLog = findLogEntry(logsRes.body.logs, 'executeViewSubmitHandler', 'view_submit_room');

		expect(viewSubmitLog, 'View submit handler log not found').to.exist;

		const roomEntry = viewSubmitLog?.entries.find((entry) => Array.isArray(entry.args) && entry.args[0] === 'view_submit_room');

		expect(roomEntry, 'Room log entry not found in view submit handler').to.exist;

		expect(roomEntry?.args[1], 'Room id should match the sent rid').to.equal(roomId);
	});

	it('should include room data in executeViewClosedHandler when rid is sent', async () => {
		const viewId = `test-view-id-${Date.now()}`;

		const interactionRes = await sendUiKitInteraction('viewClosed', {
			rid: roomId,
			payload: {
				viewId,
				view: {
					id: viewId,
					type: 'modal',
					appId: app.id,
					title: { type: 'plain_text', text: 'Test Modal' },
					blocks: [],
					state: {},
				},
				isCleared: false,
			},
		});

		expect(interactionRes.status, 'viewClosed interaction failed').to.equal(200);

		const logsRes = await getAppLogs();

		expect(logsRes.status, 'Fetching app logs failed').to.equal(200);
		expect(logsRes.body).to.have.a.property('success', true);

		const viewClosedLog = findLogEntry(logsRes.body.logs, 'executeViewClosedHandler', 'view_closed_room');

		expect(viewClosedLog, 'View closed handler log not found').to.exist;

		const roomEntry = viewClosedLog?.entries.find((entry) => Array.isArray(entry.args) && entry.args[0] === 'view_closed_room');

		expect(roomEntry, 'Room log entry not found in view closed handler').to.exist;

		expect(roomEntry?.args[1], 'Room id should match the sent rid').to.equal(roomId);
	});

	it('should not include room data when rid is not sent', async () => {
		const viewId = `test-view-id-no-rid-${Date.now()}`;

		const interactionRes = await sendUiKitInteraction('viewSubmit', {
			actionId: 'test_button',
			triggerId: `test-trigger-${Date.now()}`,
			viewId,
			payload: {
				view: {
					id: viewId,
					type: 'modal',
					appId: app.id,
					title: { type: 'plain_text', text: 'Test Modal Without Room' },
					blocks: [],
					state: {},
				},
			},
		});

		expect(interactionRes.status, 'viewSubmit interaction without rid failed').to.equal(200);

		const logsRes = await getAppLogs();

		expect(logsRes.status, 'Fetching app logs failed').to.equal(200);
		expect(logsRes.body).to.have.a.property('success', true);

		const viewSubmitLog = findLogEntry(logsRes.body.logs, 'executeViewSubmitHandler', 'view_submit_room');

		expect(viewSubmitLog, 'View submit handler log not found').to.exist;

		const roomEntry = viewSubmitLog?.entries.find((entry) => Array.isArray(entry.args) && entry.args[0] === 'view_submit_room');

		expect(roomEntry, 'Room log entry not found').to.exist;

		// When no rid is provided, the app logs 'no-room' as the fallback value
		expect(roomEntry?.args[1], 'Room data should not be present when no rid is provided').to.equal('no-room');
	});
});
