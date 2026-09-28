import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const findMessage = sandbox.stub();
const findMessages = sandbox.stub();

const { AppThreadsConverter } = proxyquire.noCallThru().load('../../../../../app/apps/server/converters/threads', {
	'@rocket.chat/models': { Messages: { findOneById: findMessage, find: findMessages } },
});

const converters = {
	rooms: { convertById: sandbox.stub() },
	users: { convertById: sandbox.stub(), convertToApp: sandbox.stub() },
};

const orch = {
	getConverters: () => ({ get: (key: 'rooms' | 'users') => converters[key] }),
} as unknown as IAppServerOrchestrator;

const converter = new AppThreadsConverter(orch);

const room = { id: 'room-1' } as IRoom;
const convertUserById = (async (id: string) => ({ __converted: 'users', id })) as any;
const convertToApp = ((user: any) => ({ __convertedToApp: 'users', id: user?._id })) as any;

const ts = new Date('2024-01-01T00:00:00.000Z');

describe('AppThreadsConverter.convertById', () => {
	beforeEach(() => {
		sandbox.reset();
		findMessages.returns({ toArray: async () => [] });
		converters.rooms.convertById.resolves(room);
		converters.users.convertById.callsFake(async (id: string) => ({ __converted: 'users', id }));
		converters.users.convertToApp.callsFake((user: any) => ({ __convertedToApp: 'users', id: user?._id }));
	});

	it('returns an empty list without loading replies when the main message does not exist', async () => {
		findMessage.resolves(null);

		expect(await converter.convertById('thread-1')).to.deep.equal([]);
		expect(findMessages.called).to.be.false;
	});

	it('returns an empty list when the thread room cannot be converted', async () => {
		findMessage.resolves({ _id: 'thread-1', rid: 'room-1', u: { _id: 'user-1' } });
		converters.rooms.convertById.resolves(undefined);

		expect(await converter.convertById('thread-1')).to.deep.equal([]);
	});

	it('converts the main message together with every message that replies to it', async () => {
		findMessage.resolves({ _id: 'thread-1', rid: 'room-1', msg: 'main', u: { _id: 'user-1' } });
		findMessages.returns({
			toArray: async () => [{ _id: 'reply-1', rid: 'room-1', tmid: 'thread-1', msg: 'reply', u: { _id: 'user-2' } }],
		});

		const result: any = await converter.convertById('thread-1');

		expect(findMessages.firstCall.args[0]).to.deep.equal({ $or: [{ _id: 'thread-1' }, { tmid: 'thread-1' }] });
		expect(converters.rooms.convertById.firstCall.args[0]).to.equal('room-1');
		expect(result.map((message: any) => message.id)).to.deep.equal(['thread-1', 'reply-1']);
		expect(result[0].room).to.equal(room);
	});

	it('converts a sender shared by several thread messages only once', async () => {
		findMessage.resolves({ _id: 'thread-1', rid: 'room-1', msg: 'main', u: { _id: 'user-1' } });
		findMessages.returns({
			toArray: async () => [
				{ _id: 'reply-1', rid: 'room-1', tmid: 'thread-1', msg: 'a', u: { _id: 'user-1' } },
				{ _id: 'reply-2', rid: 'room-1', tmid: 'thread-1', msg: 'b', u: { _id: 'user-1' } },
			],
		});

		await converter.convertById('thread-1');

		expect(converters.users.convertById.callCount).to.equal(1);
	});
});

describe('AppThreadsConverter.convertMessage', () => {
	it('leaves the sender undefined when the message has no sender id and when it has no sender at all', async () => {
		const withEmptySender: any = await converter.convertMessage(
			{ _id: 'm', rid: 'room-1', u: {} } as any,
			room,
			convertUserById,
			convertToApp,
		);
		const withoutSender: any = await converter.convertMessage({ _id: 'm2', rid: 'room-1' } as any, room, convertUserById, convertToApp);

		expect(withEmptySender).to.not.have.property('sender');
		expect(withoutSender).to.not.have.property('sender');
	});

	it('falls back to converting the raw sender when it belongs to a guest rather than a user', async () => {
		const missingUser = (async () => undefined) as any;

		const result: any = await converter.convertMessage(
			{ _id: 'm', rid: 'room-1', u: { _id: 'visitor-1', username: 'guest' } } as any,
			room,
			missingUser,
			convertToApp,
		);

		expect(result.sender).to.deep.equal({ __convertedToApp: 'users', id: 'visitor-1' });
	});

	it('maps the attachment author fields into a single author object', async () => {
		const result: any = await converter.convertMessage(
			{
				_id: 'm',
				rid: 'room-1',
				u: { _id: 'u1' },
				attachments: [{ author_name: 'Author', author_link: 'http://a', author_icon: 'http://i' }],
			} as any,
			room,
			convertUserById,
			convertToApp,
		);

		expect(result.attachments[0].author).to.deep.equal({ name: 'Author', link: 'http://a', icon: 'http://i' });
	});

	it('leaves the author and the timestamp out when the attachment carries neither', async () => {
		const result: any = await converter.convertMessage(
			{ _id: 'm', rid: 'room-1', u: { _id: 'u1' }, attachments: [{ text: 'plain' }] } as any,
			room,
			convertUserById,
			convertToApp,
		);

		expect(result.attachments[0]).to.not.have.property('author');
		expect(result.attachments[0]).to.not.have.property('timestamp');
	});

	it('keeps an attachment fileId that the message already carries', async () => {
		const result: any = await converter.convertMessage(
			{
				_id: 'm',
				rid: 'room-1',
				u: { _id: 'u1' },
				file: { _id: 'file-from-message' },
				attachments: [{ type: 'file', fileId: 'explicit' }],
			} as any,
			room,
			convertUserById,
			convertToApp,
		);

		expect(result.attachments[0].fileId).to.equal('explicit');
	});

	it('never resolves the editor of an edited message, because the editedAt rename consumes the field the guard reads', async () => {
		const result: any = await converter.convertMessage(
			{ _id: 'm', rid: 'room-1', u: { _id: 'u1' }, editedAt: ts, editedBy: { _id: 'editor-1' } } as any,
			room,
			convertUserById,
			convertToApp,
		);

		expect(result.editedAt).to.deep.equal(ts);
		expect(result).to.not.have.property('editor');
		expect(result._unmappedProperties_.editedBy).to.deep.equal({ _id: 'editor-1' });
	});
});
