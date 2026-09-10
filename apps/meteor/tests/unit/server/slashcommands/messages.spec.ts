import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import { loadCommand } from './helpers';

describe('/me', () => {
	it('formats action text and preserves the message identity and thread', async () => {
		const send = sinon.stub().resolves();
		const harness = loadCommand('me/me', { '../../meteor-methods/messages/sendMessage': { executeSendMessage: send } });
		await harness.run('me', { params: 'waves hello', message: { _id: 'message', rid: 'current-room', tmid: 'thread' } });
		sinon.assert.calledOnceWithExactly(send, 'actor', { _id: 'message', rid: 'current-room', tmid: 'thread', msg: '_waves hello_' });
	});
	it('does not send or mutate the message for whitespace-only input', async () => {
		const send = sinon.stub().resolves();
		const harness = loadCommand('me/me', { '../../meteor-methods/messages/sendMessage': { executeSendMessage: send } });
		const message = { _id: 'message', rid: 'current-room', msg: 'original' };
		await harness.run('me', { params: '  ', message });
		sinon.assert.notCalled(send);
		expect(message.msg).to.equal('original');
	});
	it('propagates a send failure', async () => {
		const error = new Error('send failed');
		const send = sinon.stub().rejects(error);
		const harness = loadCommand('me/me', { '../../meteor-methods/messages/sendMessage': { executeSendMessage: send } });
		await expect(harness.run('me', { params: 'waves' })).to.be.rejectedWith(error);
		sinon.assert.calledOnce(send);
	});
});

describe('/help', () => {
	it('sends the translated keyboard shortcuts privately in the current thread', async () => {
		const findUser = sinon.stub().resolves({ language: 'pt' });
		const harness = loadCommand('help/server', { '@rocket.chat/models': { Users: { findOneById: findUser } } });
		harness.translate.callsFake((key: string, options: { shortcut: string }) => `${key}: ${options.shortcut}`);
		await harness.run('help', { message: { _id: 'message', rid: 'current-room', tmid: 'thread' } });
		sinon.assert.calledOnceWithExactly(findUser, 'actor');
		sinon.assert.calledOnceWithExactly(harness.broadcast, 'notify.ephemeralMessage', 'actor', 'current-room', {
			msg: '\nOpen_channel_user_search: Command (or Ctrl) + p OR Command (or Ctrl) + k\nMark_all_as_read: Shift (or Ctrl) + ESC\nEdit_previous_message: Up Arrow\nMove_beginning_message: Command (or Alt) + Left Arrow\nMove_beginning_message: Command (or Alt) + Up Arrow\nMove_end_message: Command (or Alt) + Right Arrow\nMove_end_message: Command (or Alt) + Down Arrow\nNew_line_message_compose_input: Shift + Enter',
			tmid: 'thread',
		});
		expect(harness.translate.getCalls().every((call) => call.args[1].lng === 'pt')).to.equal(true);
	});
	it('provides English help without a user preference or thread', async () => {
		const harness = loadCommand('help/server', { '@rocket.chat/models': { Users: { findOneById: sinon.stub().resolves(null) } } });
		await harness.run('help');
		sinon.assert.calledOnce(harness.broadcast);
		expect(harness.broadcast.firstCall.args.slice(0, 3)).to.deep.equal(['notify.ephemeralMessage', 'actor', 'current-room']);
		expect(harness.broadcast.firstCall.args[3]).not.to.have.property('tmid');
		expect(harness.translate.getCalls()).to.have.length(8);
		expect(harness.translate.getCalls().every((call) => call.args[1].lng === 'en')).to.equal(true);
	});
});
