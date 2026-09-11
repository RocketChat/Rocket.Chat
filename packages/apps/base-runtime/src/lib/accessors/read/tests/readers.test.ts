/* eslint-disable testing-library/no-await-sync-queries -- accessor read methods are not testing-library DOM queries */
import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { createRecordingSender } from '../../tests/helpers/parityHarness';
import { CloudWorkspaceRead } from '../CloudWorkspaceRead';
import { ContactRead } from '../ContactRead';
import { LivechatRead } from '../LivechatRead';
import { MessageRead } from '../MessageRead';
import { OAuthAppsReader } from '../OAuthAppsReader';
import { PersistenceRead } from '../PersistenceRead';
import { RoleRead } from '../RoleRead';
import { RoomRead } from '../RoomRead';
import { ThreadRead } from '../ThreadRead';
import { UploadRead } from '../UploadRead';
import { UserRead } from '../UserRead';
import { VideoConferenceRead } from '../VideoConferenceRead';

const setup = (responses = {}) => {
	const rec = createRecordingSender(responses);
	return { rec, senderFn: rec.sender };
};

describe('Reader family (base-runtime)', () => {
	describe('MessageRead', () => {
		it('getById forwards to getMessageBridge:doGetById with the APP_ID sentinel', async () => {
			const { rec, senderFn } = setup({ 'bridges:getMessageBridge:doGetById': { id: 'm1' } });
			const result = await new MessageRead(senderFn).getById('m1');

			assert.deepStrictEqual(rec.emitted(), [{ method: 'bridges:getMessageBridge:doGetById', params: ['m1', 'APP_ID'] }]);
			assert.deepStrictEqual(result, { id: 'm1' });
		});

		it('getSenderUser returns the message sender, or undefined when the message is missing', async () => {
			const withMsg = setup({ 'bridges:getMessageBridge:doGetById': { id: 'm1', sender: { id: 'u1' } } });
			assert.deepStrictEqual(await new MessageRead(withMsg.senderFn).getSenderUser('m1'), { id: 'u1' });

			const noMsg = setup({ 'bridges:getMessageBridge:doGetById': null });
			assert.strictEqual(await new MessageRead(noMsg.senderFn).getSenderUser('m1'), undefined);
		});

		it('getRoom returns the message room, or undefined when the message is missing', async () => {
			const withMsg = setup({ 'bridges:getMessageBridge:doGetById': { id: 'm1', room: { id: 'r1' } } });
			assert.deepStrictEqual(await new MessageRead(withMsg.senderFn).getRoom('m1'), { id: 'r1' });

			const noMsg = setup({ 'bridges:getMessageBridge:doGetById': undefined });
			assert.strictEqual(await new MessageRead(noMsg.senderFn).getRoom('m1'), undefined);
		});
	});

	describe('RoomRead', () => {
		it('getMessages applies limit/showThreadMessages defaults', async () => {
			const { rec, senderFn } = setup({ 'bridges:getRoomBridge:doGetMessages': [] });
			await new RoomRead(senderFn).getMessages('r1');

			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getRoomBridge:doGetMessages',
				params: ['r1', { limit: 100, showThreadMessages: true }, 'APP_ID'],
			});
		});

		it('getMessages rejects a limit above 100', async () => {
			const { senderFn } = setup();
			assert.throws(() => new RoomRead(senderFn).getMessages('r1', { limit: 101 }), /Expected number <= 100, got 101/);
		});

		it('getMessages rejects an invalid sort key and direction', async () => {
			const { senderFn } = setup();
			assert.throws(() => new RoomRead(senderFn).getMessages('r1', { sort: { bogus: 'asc' } as any }), /Invalid key "bogus"/);
			// `createdAt` is a valid sortable field, so this exercises the direction check specifically.
			assert.throws(() => new RoomRead(senderFn).getMessages('r1', { sort: { createdAt: 'sideways' } as any }), /Invalid sort direction/);
		});

		it('getAllRooms validates limit and skip and forwards normalized options', async () => {
			const { rec, senderFn } = setup({ 'bridges:getRoomBridge:doGetAllRooms': [] });
			await new RoomRead(senderFn).getAllRooms();
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getRoomBridge:doGetAllRooms',
				params: [{}, { limit: 100, skip: 0 }, 'APP_ID'],
			});

			assert.throws(() => new RoomRead(setup().senderFn).getAllRooms({}, { limit: 0 } as any), /between 1 and 100/);
			assert.throws(() => new RoomRead(setup().senderFn).getAllRooms({}, { skip: -1 } as any), /Expected number >= 0/);
		});

		it('getUnreadByUser validates roomId and fills option defaults', async () => {
			const { rec, senderFn } = setup({ 'bridges:getRoomBridge:doGetUnreadByUser': [] });
			await new RoomRead(senderFn).getUnreadByUser('r1', 'u1');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getRoomBridge:doGetUnreadByUser',
				params: ['r1', 'u1', { limit: 100, sort: { createdAt: 'asc' }, skip: 0, showThreadMessages: true }, 'APP_ID'],
			});

			await assert.rejects(() => new RoomRead(setup().senderFn).getUnreadByUser('   ', 'u1'), /non-empty string/);
		});

		it('passthrough getters forward verbatim', async () => {
			const { rec, senderFn } = setup();
			const room = new RoomRead(senderFn);
			await room.getById('r1');
			await room.getMembers('r1');
			await room.getUserUnreadMessageCount('r1', 'u1');
			assert.deepStrictEqual(rec.methods(), [
				'bridges:getRoomBridge:doGetById',
				'bridges:getRoomBridge:doGetMembers',
				'bridges:getRoomBridge:doGetUserUnreadMessageCount',
			]);
		});
	});

	describe('UserRead', () => {
		it('getBySipExtension short-circuits to undefined for an empty extension (no bridge call)', async () => {
			const { rec, senderFn } = setup();
			assert.strictEqual(await new UserRead(senderFn).getBySipExtension(''), undefined);
			assert.strictEqual(rec.emitted().length, 0);
		});

		it('getAppUser defaults to the APP_ID sentinel but forwards an explicit app id raw', async () => {
			const a = setup();
			await new UserRead(a.senderFn).getAppUser();
			assert.deepStrictEqual(a.rec.emitted()[0], { method: 'bridges:getUserBridge:doGetAppUser', params: ['APP_ID'] });

			const b = setup();
			await new UserRead(b.senderFn).getAppUser('another-app');
			assert.deepStrictEqual(b.rec.emitted()[0], { method: 'bridges:getUserBridge:doGetAppUser', params: ['another-app'] });
		});
	});

	describe('PersistenceRead', () => {
		it('readByAssociation wraps the single association into an array', async () => {
			const { rec, senderFn } = setup({ 'bridges:getPersistenceBridge:doReadByAssociations': [] });
			const assoc = { type: 1, id: 'x' } as any;
			await new PersistenceRead(senderFn).readByAssociation(assoc);
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getPersistenceBridge:doReadByAssociations',
				params: [[assoc], 'APP_ID'],
			});
		});
	});

	describe('UploadRead', () => {
		it('getBufferById fetches the upload then its buffer (two bridge calls)', async () => {
			const { rec, senderFn } = setup({ 'bridges:getUploadBridge:doGetById': { _id: 'up1' } });
			await new UploadRead(senderFn).getBufferById('up1');
			assert.deepStrictEqual(rec.emitted(), [
				{ method: 'bridges:getUploadBridge:doGetById', params: ['up1', 'APP_ID'] },
				{ method: 'bridges:getUploadBridge:doGetBuffer', params: [{ _id: 'up1' }, 'APP_ID'] },
			]);
		});
	});

	describe('LivechatRead', () => {
		it('_fetchLivechatRoomMessages sends the app id first, then the room id', async () => {
			const { rec, senderFn } = setup({ 'bridges:getLivechatBridge:do_fetchLivechatRoomMessages': [] });
			await new LivechatRead(senderFn)._fetchLivechatRoomMessages('r1');
			assert.deepStrictEqual(rec.emitted()[0], {
				method: 'bridges:getLivechatBridge:do_fetchLivechatRoomMessages',
				params: ['APP_ID', 'r1'],
			});
		});
	});

	describe('simple passthrough readers', () => {
		it('route to their matching bridge method', async () => {
			const { rec, senderFn } = setup();
			await new CloudWorkspaceRead(senderFn).getWorkspaceToken('scope');
			new VideoConferenceRead(senderFn).getById('c1');
			await new OAuthAppsReader(senderFn).getOAuthAppById('o1');
			new ContactRead(senderFn).getById('ct1');
			await new ThreadRead(senderFn).getThreadById('t1');
			await new RoleRead(senderFn).getCustomRoles();

			assert.deepStrictEqual(rec.emitted(), [
				{ method: 'bridges:getCloudWorkspaceBridge:doGetWorkspaceToken', params: ['scope', 'APP_ID'] },
				{ method: 'bridges:getVideoConferenceBridge:doGetById', params: ['c1', 'APP_ID'] },
				{ method: 'bridges:getOAuthAppsBridge:doGetByid', params: ['o1', 'APP_ID'] },
				{ method: 'bridges:getContactBridge:doGetById', params: ['ct1', 'APP_ID'] },
				{ method: 'bridges:getThreadBridge:doGetById', params: ['t1', 'APP_ID'] },
				{ method: 'bridges:getRoleBridge:doGetCustomRoles', params: ['APP_ID'] },
			]);
		});
	});
});
