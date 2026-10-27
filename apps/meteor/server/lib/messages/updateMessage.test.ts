import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Messages: {
		findOneById: sinon.stub(),
		updateOne: sinon.stub(),
		addReplyByThreadId: sinon.stub(),
		decreaseReplyCountById: sinon.stub(),
	},
	Rooms: {
		findOneById: sinon.stub(),
	},
};

const notifyOnMessageChange = sinon.stub();

const { updateMessage } = proxyquire.noCallThru().load('./updateMessage', {
	'@rocket.chat/apps': { Apps: { self: undefined, isLoaded: () => false }, AppEvents: {} },
	'@rocket.chat/core-services': {
		Message: { beforeSave: async ({ message }: { message: unknown }) => message },
		ClientSafeError: Error,
	},
	'@rocket.chat/models': modelsMock,
	'../../hooks/messages/afterSaveMessage': { afterSaveMessage: sinon.stub() },
	'../../settings': { settings: { get: () => false } },
	'../messaging/validateCustomMessageFields': { validateCustomMessageFields: sinon.stub() },
	'../notifyListener': { notifyOnMessageChange, notifyOnRoomChangedById: sinon.stub() },
});

const user = { _id: 'editor', username: 'editor' };
const ts = new Date('2026-10-25T03:00:00.000Z');
const original = { _id: 'msg', rid: 'room', msg: 'hello', ts, u: { _id: 'author', username: 'author' } };

describe('updateMessage', () => {
	beforeEach(() => {
		Object.values(modelsMock).forEach((model) => Object.values(model).forEach((stub) => stub.reset()));
		notifyOnMessageChange.reset();
		modelsMock.Rooms.findOneById.resolves({ _id: 'room' });
	});

	it('should count a message moved into a thread on its new thread parent, with both authors as followers', async () => {
		modelsMock.Messages.findOneById.withArgs('parent').resolves({ _id: 'parent', u: { _id: 'parentAuthor' }, replies: [] });

		await updateMessage({ _id: 'msg', rid: 'room', msg: 'hello', tmid: 'parent' }, user, original);

		expect(modelsMock.Messages.addReplyByThreadId.calledOnceWith('parent', ['parentAuthor', 'author'], ts)).to.be.true;
		expect(modelsMock.Messages.decreaseReplyCountById.called).to.be.false;
	});

	it('should only add the author to the followers of a thread that already has replies', async () => {
		modelsMock.Messages.findOneById.withArgs('parent').resolves({ _id: 'parent', u: { _id: 'parentAuthor' }, replies: ['parentAuthor'] });

		await updateMessage({ _id: 'msg', rid: 'room', msg: 'hello', tmid: 'parent' }, user, original);

		expect(modelsMock.Messages.addReplyByThreadId.calledOnceWith('parent', ['author'], ts)).to.be.true;
	});

	it('should uncount a message moved out of a thread into the main channel', async () => {
		await updateMessage({ _id: 'msg', rid: 'room', msg: 'hello', tmid: undefined }, user, { ...original, tmid: 'parent' });

		expect(modelsMock.Messages.decreaseReplyCountById.calledOnceWith('parent', -1)).to.be.true;
		expect(notifyOnMessageChange.calledWith({ id: 'parent' })).to.be.true;
		expect(modelsMock.Messages.addReplyByThreadId.called).to.be.false;

		const [, update] = modelsMock.Messages.updateOne.firstCall.args;
		expect(update.$set).to.not.have.property('tmid');
		expect(update.$unset).to.include({ tmid: 1 });
	});

	it('should uncount a message moved to another thread from its previous thread parent', async () => {
		modelsMock.Messages.findOneById.withArgs('parent').resolves({ _id: 'parent', u: { _id: 'parentAuthor' }, replies: ['parentAuthor'] });

		await updateMessage({ _id: 'msg', rid: 'room', msg: 'hello', tmid: 'parent' }, user, { ...original, tmid: 'previousParent' });

		expect(modelsMock.Messages.decreaseReplyCountById.calledOnceWith('previousParent', -1)).to.be.true;
		expect(notifyOnMessageChange.calledWith({ id: 'previousParent' })).to.be.true;
		expect(modelsMock.Messages.addReplyByThreadId.calledOnceWith('parent', ['author'], ts)).to.be.true;
	});

	it('should leave the thread parent alone when a thread reply is edited', async () => {
		await updateMessage({ _id: 'msg', rid: 'room', msg: 'edited' }, user, { ...original, tmid: 'parent' });

		expect(modelsMock.Messages.addReplyByThreadId.called).to.be.false;
		expect(modelsMock.Messages.decreaseReplyCountById.called).to.be.false;
	});
});
