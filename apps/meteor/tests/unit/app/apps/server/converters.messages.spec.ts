import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { convertMessageFiles } from '../../../../../app/apps/server/converters/convertMessageFiles';

const sandbox = sinon.createSandbox();

const findRoom = sandbox.stub();
const findUser = sandbox.stub();

const { AppMessagesConverter } = proxyquire.noCallThru().load('../../../../../app/apps/server/converters/messages', {
	'@rocket.chat/models': { Rooms: { findOneById: findRoom }, Users: { findOneById: findUser } },
});

const orch = {
	getConverters: () => ({
		get: (key: string) => ({
			convertById: async (id: string) => ({ __converted: key, id }),
			convertToApp: (user: any) => ({ __convertedToApp: key, id: user?._id }),
		}),
	}),
} as unknown as IAppServerOrchestrator;

const converter = new AppMessagesConverter(orch);

const ts = new Date('2024-01-01T00:00:00.000Z');

describe('AppMessagesConverter.convertAppMessage', () => {
	beforeEach(() => {
		sandbox.reset();
		findRoom.resolves({ _id: 'room-1' });
		findUser.resolves(undefined);
	});

	it('throws when the room referenced by the app message no longer exists', async () => {
		findRoom.resolves(null);

		await expect(converter.convertAppMessage({ id: 'msg-1', room: { id: 'gone' }, text: 'hi' })).to.be.rejectedWith(
			'Invalid room provided on the message.',
		);
	});

	it('leaves rid out of a partial message instead of throwing when the room is missing', async () => {
		const result = await converter.convertAppMessage({ id: 'msg-1', text: 'hi' }, true);

		expect(result).to.deep.equal({ _id: 'msg-1', msg: 'hi' });
	});

	it('produces exactly the Rocket.Chat fields the app message carries, adding no undefined keys', async () => {
		const result = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			sender: { id: 'user-1', username: 'john', name: 'John' },
			text: 'hi',
			createdAt: ts,
			updatedAt: ts,
		});

		expect(result).to.deep.equal({
			_id: 'msg-1',
			rid: 'room-1',
			u: { _id: 'user-1', username: 'john', name: 'John' },
			msg: 'hi',
			ts,
			_updatedAt: ts,
		});
	});

	it('takes the sender identity from the database when the user still exists', async () => {
		findUser.resolves({ _id: 'user-1', username: 'stored', name: 'Stored Name' });

		const result: any = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			sender: { id: 'user-1', username: 'stale', name: 'Stale Name' },
			createdAt: ts,
		});

		expect(findUser.firstCall.args[0]).to.equal('user-1');
		expect(result.u).to.deep.equal({ _id: 'user-1', username: 'stored', name: 'Stored Name' });
	});

	it('falls back to the sender carried on the app payload when the user no longer exists', async () => {
		const result: any = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			sender: { id: 'user-1', username: 'ghost', name: 'Ghost' },
			createdAt: ts,
		});

		expect(result.u).to.deep.equal({ _id: 'user-1', username: 'ghost', name: 'Ghost' });
	});

	it('takes the editor identity from the database when the user still exists', async () => {
		findUser.resolves({ _id: 'editor-1', username: 'stored', name: 'Stored Name' });

		const result: any = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			editor: { id: 'editor-1', username: 'stale' },
			createdAt: ts,
		});

		expect(result.editedBy).to.deep.equal({ _id: 'editor-1', username: 'stored' });
	});

	it('generates an id and a creation timestamp when the app message has neither', async () => {
		const result: any = await converter.convertAppMessage({ room: { id: 'room-1' }, text: 'hi' });

		expect(result._id).to.be.a('string').that.is.not.empty;
		expect(result.ts).to.be.a('date');
	});

	it('merges _unmappedProperties_ into a full message', async () => {
		const result: any = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			createdAt: ts,
			_unmappedProperties_: { spare: 'keep' },
		});

		expect(result.spare).to.equal('keep');
	});

	it('does not merge _unmappedProperties_ into a partial message', async () => {
		const result: any = await converter.convertAppMessage(
			{ id: 'msg-1', room: { id: 'room-1' }, createdAt: ts, _unmappedProperties_: { spare: 'keep' } },
			true,
		);

		expect(result).to.not.have.property('spare');
	});

	it('omits attachments when the app message carries a non-array value', async () => {
		const result: any = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			createdAt: ts,
			attachments: 'not-an-array',
		});

		expect(result).to.not.have.property('attachments');
	});

	it('maps the attachment author, title and timestamp back to the Rocket.Chat shape', async () => {
		const result: any = await converter.convertAppMessage({
			id: 'msg-1',
			room: { id: 'room-1' },
			createdAt: ts,
			attachments: [
				{
					author: { name: 'Author', link: 'http://a', icon: 'http://i' },
					title: { value: 'Title', link: 'http://t', displayDownloadLink: true },
					timestamp: ts,
					timestampLink: 'http://ts',
					thumbnailUrl: 'http://thumb',
					collapsed: false,
				},
			],
		});

		expect(result.attachments).to.deep.equal([
			{
				collapsed: false,
				ts: '2024-01-01T00:00:00.000Z',
				message_link: 'http://ts',
				thumb_url: 'http://thumb',
				author_name: 'Author',
				author_link: 'http://a',
				author_icon: 'http://i',
				title: 'Title',
				title_link: 'http://t',
				title_link_download: true,
			},
		]);
	});
});

describe('AppMessagesConverter.convertMessage', () => {
	it('leaves the sender undefined when the message has no sender id and when it has no sender at all', async () => {
		const withEmptySender: any = await converter.convertMessage({ _id: 'msg-1', rid: 'room-1', msg: 'hi', u: {} } as any);
		const withoutSender: any = await converter.convertMessage({ _id: 'msg-2', rid: 'room-1', msg: 'hi' } as any);

		expect(withEmptySender).to.not.have.property('sender');
		expect(withoutSender).to.not.have.property('sender');
	});

	it('resolves a visitor sender through convertToApp when the message carries a token', async () => {
		const result: any = await converter.convertMessage({
			_id: 'msg-1',
			rid: 'room-1',
			msg: 'hi',
			token: 'visitor-token',
			u: { _id: 'visitor-1', username: 'guest' },
		} as any);

		expect(result.sender).to.deep.equal({ __convertedToApp: 'users', id: 'visitor-1' });
	});

	it('keeps an attachment fileId that the message already carries', async () => {
		const result: any = await converter.convertMessage({
			_id: 'msg-1',
			rid: 'room-1',
			msg: 'hi',
			u: { _id: 'user-1' },
			file: { _id: 'file-from-message' },
			attachments: [{ type: 'file', fileId: 'file-from-attachment' }],
		} as any);

		expect(result.attachments[0].fileId).to.equal('file-from-attachment');
	});

	it('never infers a missing attachment fileId from the single message file, because the type rename consumes attachment.type first', async () => {
		const result: any = await converter.convertMessage({
			_id: 'msg-1',
			rid: 'room-1',
			msg: 'hi',
			u: { _id: 'user-1' },
			file: { _id: 'file-from-message' },
			attachments: [{ type: 'file' }],
		} as any);

		expect(result.attachments[0].type).to.equal('file');
		expect(result.attachments[0]).to.not.have.property('fileId');
	});
});

describe('convertMessageFiles', () => {
	it('keeps the typeGroup a file already declares instead of inferring a thumbnail', async () => {
		const files = [
			{ _id: 'f1', name: 'a.png', typeGroup: 'image' },
			{ _id: 'f2', name: 'b.png', typeGroup: 'image' },
		] as any;

		expect(await convertMessageFiles(files, [{ text: 'a' }] as any)).to.deep.equal(files);
	});

	it('infers the thumbnail typeGroup for the second file of a legacy single-attachment message', async () => {
		const files = [
			{ _id: 'f1', name: 'a.png' },
			{ _id: 'f2', name: 'a-thumb.png' },
		] as any;

		expect(await convertMessageFiles(files, [{ text: 'a' }] as any)).to.deep.equal([
			{ _id: 'f1', name: 'a.png' },
			{ _id: 'f2', name: 'a-thumb.png', typeGroup: 'thumb' },
		]);
	});

	it('leaves the files untouched when the message carries no attachments at all', async () => {
		const files = [
			{ _id: 'f1', name: 'a.png' },
			{ _id: 'f2', name: 'b.png' },
		] as any;

		expect(await convertMessageFiles(files, undefined)).to.deep.equal(files);
	});
});
