import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

describe('/msg', () => {
	let findTarget: sinon.SinonStub;
	let findActor: sinon.SinonStub;
	let createDirect: sinon.SinonStub;
	let send: sinon.SinonStub;
	let harness: ReturnType<typeof loadCommand>;
	beforeEach(() => {
		findTarget = sinon.stub().resolves({ _id: 'target', username: 'bob' });
		findActor = sinon.stub().resolves({ _id: 'actor', language: 'pt' });
		createDirect = sinon.stub().resolves({ rid: 'direct-room' });
		send = sinon.stub().resolves();
		harness = loadCommand('msg/server', {
			'@rocket.chat/models': { Users: { findOneByUsernameIgnoringCase: findTarget, findOneById: findActor } },
			'@rocket.chat/random': { Random: { id: () => 'generated-id' } },
			'../../meteor-methods/messages/createDirectMessage': { createDirectMessage: createDirect },
			'../../meteor-methods/messages/sendMessage': { executeSendMessage: send },
		});
	});
	it('sends the entire message to the direct room for the normalized recipient', async () => {
		await harness.run('msg', { params: '  @bob hello  there  ' });
		sinon.assert.calledOnceWithExactly(findTarget, 'bob');
		sinon.assert.calledOnceWithExactly(createDirect, ['bob'], 'actor');
		sinon.assert.calledOnceWithExactly(send, 'actor', { _id: 'generated-id', rid: 'direct-room', msg: 'hello  there' });
		sinon.assert.notCalled(harness.broadcast);
	});
	['', '@bob'].forEach((params) => {
		it(`reports incomplete input ${JSON.stringify(params)} without creating a conversation`, async () => {
			await harness.run('msg', { params });
			harness.expectFeedback('Username_and_message_must_not_be_empty');
			sinon.assert.notCalled(findTarget);
			sinon.assert.notCalled(createDirect);
			sinon.assert.notCalled(send);
		});
	});
	[
		{ user: { language: 'pt' }, language: 'de', expected: 'pt' },
		{ user: {}, language: 'de', expected: 'de' },
		{ user: null, language: undefined, expected: 'en' },
	].forEach(({ user, language, expected }) => {
		it(`reports an unknown recipient in ${expected} without sending`, async () => {
			findTarget.resolves(null);
			findActor.resolves(user);
			harness.settings.get.withArgs('Language').returns(language);
			await harness.run('msg', { params: '@bob hello' });
			sinon.assert.calledOnceWithExactly(findTarget, 'bob');
			harness.expectFeedback('Username_doesnt_exist');
			expect(harness.translate.firstCall.args[1]).to.include({ username: '@bob', lng: expected });
			sinon.assert.notCalled(createDirect);
			sinon.assert.notCalled(send);
		});
	});
	it('does not send when creation of the direct room fails', async () => {
		const error = new Error('Not authorized');
		createDirect.rejects(error);
		await expect(harness.run('msg', { params: 'bob hello' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(createDirect);
		sinon.assert.notCalled(send);
	});
	it('propagates a send failure', async () => {
		const error = new Error('send failed');
		send.rejects(error);
		await expect(harness.run('msg', { params: 'bob hello' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(send);
	});
});
