import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

const proxyquire = require('proxyquire');

const findOneById = sinon.stub();
const canAccessConference = sinon.stub();
const getRemoteLiveKitToken = sinon.stub();

const { getFederatedToken } = proxyquire.noCallThru().load('./federatedToken', {
	'@rocket.chat/core-services': { Authorization: { canAccessConference }, FederationMatrix: { getRemoteLiveKitToken } },
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

describe('getFederatedToken', () => {
	beforeEach(() => {
		[findOneById, canAccessConference, getRemoteLiveKitToken].forEach((stub) => stub.reset());
		findOneById.resolves(federatedCall);
		canAccessConference.resolves(true);
		getRemoteLiveKitToken.resolves({ serverUrl: 'wss://livekit.rc2', token: 'remote-jwt' });
	});

	it("hands over the token the other homeserver's SFU gave for this member", async () => {
		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({
			token: { serverUrl: 'wss://livekit.rc2', token: 'remote-jwt' },
		});
		expect(getRemoteLiveKitToken.firstCall.args).to.deep.equal([federatedCall, user, 'rc2', 'wss://livekit.rc2']);
	});

	it('serves a call still ringing, which a remote member may already be in', async () => {
		findOneById.resolves({ ...federatedCall, status: 0 });

		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.have.property('token');
	});

	it('refuses a call that does not exist', async () => {
		findOneById.resolves(null);

		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({ error: 'error-videoconf-invalid-call' });
	});

	[
		['has ended', { endedAt: new Date() }],
		['expired', { status: 2 }],
		['was declined', { status: 4 }],
	].forEach(([what, change]) => {
		it(`refuses a call that ${what}, asking nobody`, async () => {
			findOneById.resolves({ ...federatedCall, ...(change as object) });

			expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({ error: 'error-videoconf-invalid-call' });
			expect(getRemoteLiveKitToken.called).to.be.false;
		});
	});

	it('refuses someone who cannot access the conference, asking nobody', async () => {
		canAccessConference.resolves(false);

		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({ error: 'forbidden' });
		expect(getRemoteLiveKitToken.called).to.be.false;
	});

	it('refuses a call that is not federated', async () => {
		findOneById.resolves({ ...federatedCall, federation: undefined });

		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({ error: 'error-videoconf-not-federated' });
	});

	it('refuses a call another provider runs', async () => {
		findOneById.resolves({ ...federatedCall, providerName: 'jitsi' });

		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({ error: 'error-videoconf-not-federated' });
	});

	it('reports a token the other homeserver would not give', async () => {
		getRemoteLiveKitToken.rejects(new Error('Federation request failed: 403'));

		expect(await getFederatedToken('call', user, 'rc2', 'wss://livekit.rc2')).to.deep.equal({
			error: 'error-videoconf-federated-token-failed',
		});
	});
});
