import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

import { AppObjectRegistry } from '../../../../AppObjectRegistry';
import { createRecordingSender } from '../../tests/helpers/parityHarness';
import { LivechatUpdater } from '../LivechatUpdater';
import { ModerationModify } from '../ModerationModify';
import { ModifyDeleter } from '../ModifyDeleter';
import { OAuthAppsModify } from '../OAuthAppsModify';
import { SchedulerModify } from '../SchedulerModify';
import { UIController } from '../UIController';
import { UploadCreator } from '../UploadCreator';
import { UserUpdater } from '../UserUpdater';

const setup = (responses = {}) => {
	const rec = createRecordingSender(responses);
	return { rec, sender: rec.sender };
};

describe('Modify accessors (base-runtime)', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'deno-test');
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	describe('ModifyDeleter', () => {
		it('deleteRoom/deleteMessage/removeUsersFromRoom use the APP_ID sentinel', async () => {
			const { rec, sender } = setup();
			const deleter = new ModifyDeleter(sender);
			const message = { id: 'm1' } as any;
			const user = { id: 'u1' } as any;
			await deleter.deleteRoom('r1');
			await deleter.deleteMessage(message, user);
			await deleter.removeUsersFromRoom('r1', ['a', 'b']);
			assert.deepStrictEqual(rec.emitted(), [
				{ method: 'bridges:getRoomBridge:doDelete', params: ['r1', 'APP_ID'] },
				{ method: 'bridges:getMessageBridge:doDelete', params: [message, user, 'APP_ID'] },
				{ method: 'bridges:getRoomBridge:doRemoveUsers', params: ['r1', ['a', 'b'], 'APP_ID'] },
			]);
		});

		it('removeUsersFromRoom rejects more than 50 usernames', async () => {
			const { sender } = setup();
			await assert.rejects(
				() =>
					new ModifyDeleter(sender).removeUsersFromRoom(
						'r1',
						Array.from({ length: 51 }, (_v, i) => `u${i}`),
					),
				/maximum of 50 members/,
			);
		});

		it('deleteUsers forwards the app-supplied appId argument raw (not the sentinel)', async () => {
			const { rec, sender } = setup();
			await new ModifyDeleter(sender).deleteUsers('target-app', 'bot' as any);
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getUserBridge:doDeleteUsersCreatedByApp',
				params: ['target-app', 'bot'],
			});
		});
	});

	describe('SchedulerModify', () => {
		it('namespaces the job id with the real app id and sends the APP_ID sentinel as identity', async () => {
			const { rec, sender } = setup();
			await new SchedulerModify(sender).scheduleOnce({ id: 'job', when: 'x' } as any);
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getSchedulerBridge:doScheduleOnce',
				params: [{ id: 'job_deno-test', when: 'x' }, 'APP_ID'],
			});
		});

		it('does not double-namespace an id that already carries the app id', async () => {
			const { rec, sender } = setup();
			await new SchedulerModify(sender).cancelJob('job_deno-test');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getSchedulerBridge:doCancelJob',
				params: ['job_deno-test', 'APP_ID'],
			});
		});
	});

	describe('ModerationModify', () => {
		it('forwards the app-supplied appId argument raw', async () => {
			const { rec, sender } = setup();
			await new ModerationModify(sender).report('m1', 'desc', 'u1', 'target-app');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getModerationBridge:doReport',
				params: ['m1', 'desc', 'u1', 'target-app'],
			});
		});
	});

	describe('OAuthAppsModify', () => {
		it('createOAuthApp forwards with the APP_ID sentinel', async () => {
			const { rec, sender } = setup();
			await new OAuthAppsModify(sender).createOAuthApp({ name: 'x' } as any);
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getOAuthAppsBridge:doCreate',
				params: [{ name: 'x' }, 'APP_ID'],
			});
		});
	});

	describe('UserUpdater', () => {
		it('updateStatus wraps statusText+status into a partial user update', async () => {
			const { rec, sender } = setup();
			await new UserUpdater(sender).updateStatus({ id: 'u1' } as any, 'brb', 'online' as any);
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getUserBridge:doUpdate',
				params: [{ id: 'u1' }, { statusText: 'brb', status: 'online' }, 'APP_ID'],
			});
		});

		it('endActiveState sends the sentinel in the middle position, statusId last', async () => {
			const { rec, sender } = setup();
			await new UserUpdater(sender).endActiveState('u1', 'status-1');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getUserBridge:doEndActiveState',
				params: ['u1', 'APP_ID', 'status-1'],
			});
		});
	});

	describe('LivechatUpdater', () => {
		it('setCustomFields maps a >0 host result to boolean true', async () => {
			const { sender } = setup({ 'bridges:getLivechatBridge:doSetCustomFields': 1 });
			assert.strictEqual(await new LivechatUpdater(sender).setCustomFields('tok', 'k', 'v', true), true);

			const zero = setup({ 'bridges:getLivechatBridge:doSetCustomFields': 0 });
			assert.strictEqual(await new LivechatUpdater(zero.sender).setCustomFields('tok', 'k', 'v', true), false);
		});
	});

	describe('UploadCreator', () => {
		it('does not fetch the app user when a visitorToken is provided', async () => {
			const { rec, sender } = setup();
			await new UploadCreator(sender).uploadBuffer(Buffer.from([1]), {
				filename: 'f',
				room: { id: 'r1' },
				visitorToken: 'vtok',
			} as any);
			assert.deepStrictEqual(rec.methods(), ['bridges:getUploadBridge:doCreateUpload']);
		});
	});

	describe('UIController', () => {
		it('openSurfaceView routes a modal through doNotifyUser with the APP_ID sentinel and stamps the real app id', async () => {
			const { rec, sender } = setup();
			const user = { id: 'u1' } as any;
			await new UIController(sender).openSurfaceView(
				{ type: 'modal', title: { type: 'plain_text', text: 't' }, blocks: [{ type: 'section' }] } as any,
				{ triggerId: 'tr1' } as any,
				user,
			);

			const call = rec.emitted()[0];
			assert.deepEqual(call.params[0], user);
			assert.strictEqual(call.method, 'bridges:getUiInteractionBridge:doNotifyUser');
			assert.strictEqual(call.params[2], 'APP_ID');
			// The interaction payload carries the resolved app id (nested field, not sentinel-substituted).
			assert.strictEqual((call.params[1] as any).appId, 'deno-test');
		});
	});
});
