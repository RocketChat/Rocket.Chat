import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

const proxyquire = require('proxyquire');

const findOneById = sinon.stub();
const canAccessConference = sinon.stub();
const sendRTCHand = sinon.stub();
const sendRTCReaction = sinon.stub();

const { sendFederatedHand, sendFederatedReaction } = proxyquire.noCallThru().load('./federatedSignals', {
	'@rocket.chat/core-services': { Authorization: { canAccessConference }, FederationMatrix: { sendRTCHand, sendRTCReaction } },
	'@rocket.chat/logger': {
		Logger: class {
			error = sinon.stub();
		},
	},
	'@rocket.chat/models': { VideoConference: { findOneById } },
});

const user = { _id: 'uid', username: 'alice' };
const federatedCall = {
	_id: 'call',
	rid: 'rid',
	providerName: 'livekit',
	status: 1,
	federation: { mrid: '!room:rc1', slotId: 'm.call#ROOM' },
};

describe('federated hands and reactions', () => {
	beforeEach(() => {
		[findOneById, canAccessConference, sendRTCHand, sendRTCReaction].forEach((stub) => stub.reset());
		findOneById.resolves(federatedCall);
		canAccessConference.resolves(true);
		sendRTCHand.resolves();
		sendRTCReaction.resolves();
	});

	it('raises and lowers the member hand for the other homeservers', async () => {
		expect(await sendFederatedHand('call', user, true)).to.deep.equal({ sent: true });
		expect(await sendFederatedHand('call', user, false)).to.deep.equal({ sent: true });

		expect(sendRTCHand.firstCall.args).to.deep.equal([federatedCall, user, true]);
		expect(sendRTCHand.secondCall.args).to.deep.equal([federatedCall, user, false]);
	});

	it('shows the other homeservers a reaction of the member', async () => {
		expect(await sendFederatedReaction('call', user, '🎉')).to.deep.equal({ sent: true });
		expect(sendRTCReaction.firstCall.args).to.deep.equal([federatedCall, user, '🎉']);
	});

	it('refuses a call that is not running, telling nobody', async () => {
		findOneById.resolves({ ...federatedCall, endedAt: new Date() });

		expect(await sendFederatedHand('call', user, true)).to.deep.equal({ error: 'error-videoconf-invalid-call' });
		expect(sendRTCHand.called).to.be.false;
	});

	it('refuses someone who cannot access the conference, telling nobody', async () => {
		canAccessConference.resolves(false);

		expect(await sendFederatedReaction('call', user, '🎉')).to.deep.equal({ error: 'forbidden' });
		expect(sendRTCReaction.called).to.be.false;
	});

	// Outside a federated call everyone in it hears about hands and reactions over the call itself.
	it('refuses a call that is not federated', async () => {
		findOneById.resolves({ ...federatedCall, federation: undefined });

		expect(await sendFederatedHand('call', user, true)).to.deep.equal({ error: 'error-videoconf-not-federated' });
	});

	it('reports a hand the other homeservers could not be told about', async () => {
		sendRTCHand.rejects(new Error('no membership'));

		expect(await sendFederatedHand('call', user, true)).to.deep.equal({ error: 'error-videoconf-federated-signal-failed' });
	});
});
