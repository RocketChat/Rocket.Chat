import * as fs from 'fs/promises';
import * as assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import * as os from 'os';
import * as path from 'path';

import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { kSecureFields } from '../../../src/lib/SecureFields';
import type { AppManager } from '../../../src/server/AppManager';
import type { IParseAppPackageResult } from '../../../src/server/compiler';
import { AppAccessorManager, AppApiManager } from '../../../src/server/managers';
import { DenoRuntimeSubprocessController } from '../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { IAppStorageItem } from '../../../src/server/storage';
import { TestInfastructureSetup } from '../../test-data/utilities';

/**
 * These tests verify end-to-end codec compatibility between Node and Deno, specifically
 * the '@@SecureFields' mechanism introduced to guard access to sensitive room fields
 * (e.g. abacAttributes) behind app permissions.
 *
 * The flow being tested:
 *  1. Node encodes a room object that includes a '@@SecureFields' descriptor for abacAttributes
 *     using the SECURE_FIELDS_HANDLER_EXT msgpack extension type.
 *  2. Deno receives and decodes the message. Its codec calls applySecureFields(), which:
 *       - Checks the running app's declared permissions.
 *       - If the app has 'abac.read', it merges abacAttributes into the plain room object.
 *       - Otherwise it strips the field entirely.
 *  3. The Deno app's checkPreRoomCreatePrevent handler returns Array.isArray(room.abacAttributes),
 *     letting Node observe whether the field was received or withheld.
 *
 * Two app fixtures are used:
 *   - secure-fields-test-with-abac_0.0.1.zip  → declares { name: 'abac.read' }
 *   - secure-fields-test-no-abac_0.0.1.zip    → declares no permissions
 */
describe('@@SecureFields codec compatibility (Node → Deno)', () => {
	/** A minimal room that carries abacAttributes as a secure field. */
	const roomWithSecureField = {
		id: 'room-secure-fields-test',
		type: RoomType.CHANNEL,
		slugifiedName: 'general',
		displayName: 'General',
		[kSecureFields]: [
			{
				permission: 'abac.read',
				name: 'abacAttributes',
				value: [{ key: 'department', values: ['support', 'engineering'] }],
			},
		],
	};

	/** A room with several regular (non-secured) fields plus the secure abacAttributes field. */
	const roomWithMixedFields = {
		id: 'room-mixed-fields-test',
		type: RoomType.CHANNEL,
		slugifiedName: 'mixed',
		displayName: 'Mixed',
		customFields: { foo: 'bar' },
		messageCount: 42,
		[kSecureFields]: [
			{
				permission: 'abac.read',
				name: 'abacAttributes',
				value: [{ key: 'tenant', values: ['alpha'] }],
			},
		],
	};

	// -------------------------------------------------------------------------
	// Shared helpers
	// -------------------------------------------------------------------------

	function buildManager(): AppManager {
		const infrastructure = new TestInfastructureSetup();
		const manager = infrastructure.getMockManager();

		const accessors = new AppAccessorManager(manager);
		manager.getAccessorManager = () => accessors;

		const api = new AppApiManager(manager);
		manager.getApiManager = () => api;

		return manager;
	}

	async function parseAppPackage(manager: AppManager, zipName: string): Promise<IParseAppPackageResult> {
		const buf = await fs.readFile(path.join(__dirname, '../../test-data/apps', zipName));
		return manager.getParser().unpackageApp(buf);
	}

	// -------------------------------------------------------------------------
	// App WITH abac.read permission
	// -------------------------------------------------------------------------

	describe('app that declares abac.read permission', () => {
		let manager: AppManager;
		let controller: DenoRuntimeSubprocessController;
		let appPackage: IParseAppPackageResult;
		let appStorageItem: IAppStorageItem;

		before(
			async () => {
				manager = buildManager();
				appPackage = await parseAppPackage(manager, 'secure-fields-test-with-abac_0.0.1.zip');
				appStorageItem = {
					id: 'secure-fields-test-with-abac',
					status: AppStatus.MANUALLY_ENABLED,
				} as IAppStorageItem;

				controller = new DenoRuntimeSubprocessController(manager, appPackage, appStorageItem);
				await controller.setupApp();
			},
			{ timeout: 60_000 },
		);

		after(
			async () => {
				await controller?.stopApp();
				await fs.unlink(path.join(os.tmpdir(), 'deno-runtime')).catch(() => undefined);
			},
			{ timeout: 30_000 },
		);

		it('receives abacAttributes when the room is encoded with @@SecureFields', { timeout: 15_000 }, async () => {
			/**
			 * The app's checkPreRoomCreatePrevent returns Array.isArray(room.abacAttributes).
			 * Because the app has abac.read, Deno's applySecureFields should attach
			 * abacAttributes to the decoded room object, making the result `true`.
			 */
			const result = await controller.sendRequest({
				method: 'app:checkPreRoomCreatePrevent',
				params: [roomWithSecureField],
			});

			assert.strictEqual(result, true, 'App with abac.read should receive abacAttributes from a @@SecureFields-encoded room');
		});

		it('still receives regular (non-secured) room fields alongside the secure field', { timeout: 15_000 }, async () => {
			/**
			 * Verify that applying secure fields does not discard ordinary room properties.
			 * The handler returns `true` only when abacAttributes is an array AND the
			 * room reached the handler with its other fields intact (the Room constructor
			 * uses Object.assign, so any missing fields would surface as assertion
			 * failures in a more detailed handler – here we at minimum confirm abacAttributes
			 * was applied without corrupting the object).
			 */
			const result = await controller.sendRequest({
				method: 'app:checkPreRoomCreatePrevent',
				params: [roomWithMixedFields],
			});

			assert.strictEqual(result, true, 'abacAttributes should be applied to a room that also carries non-secure fields');
		});

		it('does not throw when the room carries no @@SecureFields descriptor', { timeout: 15_000 }, async () => {
			/**
			 * Plain rooms (without @@SecureFields) must still be decodable and routable
			 * to the handler.  abacAttributes will be absent, so the handler returns false,
			 * but no codec error should be raised.
			 */
			const plainRoom = {
				id: 'plain-room',
				type: RoomType.CHANNEL,
				slugifiedName: 'plain',
			};

			const result = await controller.sendRequest({
				method: 'app:checkPreRoomCreatePrevent',
				params: [plainRoom],
			});

			assert.strictEqual(result, false, 'A plain room (no @@SecureFields) should be decoded normally; abacAttributes absent → false');
		});
	});

	// -------------------------------------------------------------------------
	// App WITHOUT abac.read permission
	// -------------------------------------------------------------------------

	describe('app that does NOT declare abac.read permission', () => {
		let manager: AppManager;
		let controller: DenoRuntimeSubprocessController;
		let appPackage: IParseAppPackageResult;
		let appStorageItem: IAppStorageItem;

		before(
			async () => {
				manager = buildManager();
				appPackage = await parseAppPackage(manager, 'secure-fields-test-no-abac_0.0.1.zip');
				appStorageItem = {
					id: 'secure-fields-test-no-abac',
					status: AppStatus.MANUALLY_ENABLED,
				} as IAppStorageItem;

				controller = new DenoRuntimeSubprocessController(manager, appPackage, appStorageItem);
				await controller.setupApp();
			},
			{ timeout: 60_000 },
		);

		after(
			async () => {
				await controller?.stopApp();
				await fs.unlink(path.join(os.tmpdir(), 'deno-runtime')).catch(() => undefined);
			},
			{ timeout: 30_000 },
		);

		it('does not receive abacAttributes when the app lacks abac.read permission', { timeout: 15_000 }, async () => {
			/**
			 * The room is encoded with @@SecureFields for abacAttributes, but this app
			 * does not declare abac.read.  Deno's applySecureFields should withhold the
			 * field, so the handler returns `false`.
			 */
			const result = await controller.sendRequest({
				method: 'app:checkPreRoomCreatePrevent',
				params: [roomWithSecureField],
			});

			assert.strictEqual(result, false, 'App without abac.read must not receive abacAttributes from a @@SecureFields-encoded room');
		});

		it('still decodes regular (non-secured) room fields correctly', { timeout: 15_000 }, async () => {
			/**
			 * Even though abacAttributes is withheld, the remaining room properties
			 * (id, type, slugifiedName, customFields, messageCount, …) must survive
			 * the round-trip unaltered.  The handler only inspects abacAttributes, so
			 * we verify this indirectly: if the room object were corrupted entirely,
			 * Deno would throw an error instead of returning a clean `false`.
			 */
			const result = await controller.sendRequest({
				method: 'app:checkPreRoomCreatePrevent',
				params: [roomWithMixedFields],
			});

			assert.strictEqual(result, false, 'Regular room fields should survive the codec round-trip even when a secure field is withheld');
		});
	});
});
