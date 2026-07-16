import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const hasOfflineLicenseStub = sinon.stub();
const retrieveRegistrationStatusStub = sinon.stub();
const userLoggedOutStub = sinon.stub();
const fetchStub = sinon.stub();
const findOneByIdStub = sinon.stub();
const settingsGetStub = sinon.stub();

const { userLogout } = proxyquire.noCallThru().load('../../../../../server/lib/cloud/userLogout.ts', {
	'@rocket.chat/license': { License: { hasOfflineLicense: hasOfflineLicenseStub } },
	'@rocket.chat/models': { Users: { findOneById: findOneByIdStub } },
	'@rocket.chat/server-fetch': { serverFetch: fetchStub },
	'./retrieveRegistrationStatus': { retrieveRegistrationStatus: retrieveRegistrationStatusStub },
	'./userLoggedOut': { userLoggedOut: userLoggedOutStub },
	'../../settings': { settings: { get: settingsGetStub } },
	'../logger/system': { SystemLogger: { error: sinon.stub() } },
});

describe('userLogout', () => {
	beforeEach(() => {
		hasOfflineLicenseStub.reset();
		retrieveRegistrationStatusStub.reset();
		userLoggedOutStub.reset();
		fetchStub.reset();
		findOneByIdStub.reset();
		settingsGetStub.reset();
	});

	it('should still destroy local cloud credentials on logout under an offline license, without calling the revocation endpoint', async () => {
		retrieveRegistrationStatusStub.resolves({ workspaceRegistered: true });
		hasOfflineLicenseStub.returns(true);
		userLoggedOutStub.resolves(true);

		const result = await userLogout('user-id');

		expect(userLoggedOutStub.calledOnceWithExactly('user-id')).to.be.true;
		expect(fetchStub.called).to.be.false;
		expect(result).to.be.true;
	});

	it('should revoke the refresh token and destroy local cloud credentials when the license is not offline', async () => {
		retrieveRegistrationStatusStub.resolves({ workspaceRegistered: true });
		hasOfflineLicenseStub.returns(false);
		findOneByIdStub.resolves({ _id: 'user-id', services: { cloud: { refreshToken: 'refresh-token' } } });
		settingsGetStub.withArgs('Cloud_Workspace_Client_Id').returns('client-id');
		settingsGetStub.withArgs('Cloud_Workspace_Client_Secret').returns('client-secret');
		settingsGetStub.withArgs('Cloud_Url').returns('https://cloud.rocket.chat');
		fetchStub.resolves({});
		userLoggedOutStub.resolves(true);

		const result = await userLogout('user-id');

		expect(fetchStub.calledOnce).to.be.true;
		expect(fetchStub.firstCall.args[0]).to.equal('https://cloud.rocket.chat/api/oauth/revoke');
		expect(userLoggedOutStub.calledOnceWithExactly('user-id')).to.be.true;
		expect(result).to.be.true;
	});

	it('should do nothing when the workspace is not registered', async () => {
		retrieveRegistrationStatusStub.resolves({ workspaceRegistered: false });

		const result = await userLogout('user-id');

		expect(result).to.equal('');
		expect(fetchStub.called).to.be.false;
		expect(userLoggedOutStub.called).to.be.false;
	});
});
