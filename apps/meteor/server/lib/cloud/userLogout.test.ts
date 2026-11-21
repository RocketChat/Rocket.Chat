import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const hasOfflineLicenseStub = sinon.stub();
const retrieveRegistrationStatusStub = sinon.stub();
const userLoggedOutStub = sinon.stub();
const fetchStub = sinon.stub();
const findOneByIdStub = sinon.stub();
const settingsGetStub = sinon.stub();

let userLogout: typeof import('./userLogout').userLogout;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/license', { exports: { License: { hasOfflineLicense: hasOfflineLicenseStub } } }),
		mock.module('@rocket.chat/server-fetch', { exports: { serverFetch: fetchStub } }),
		mock.module('./retrieveRegistrationStatus', { exports: { retrieveRegistrationStatus: retrieveRegistrationStatusStub } }),
		mock.module('./userLoggedOut', { exports: { userLoggedOut: userLoggedOutStub } }),
		mock.module('../../settings', { exports: { settings: { get: settingsGetStub } } }),
		mock.module('../logger/system', { exports: { SystemLogger: { error: sinon.stub() } } }),
	];
	({ userLogout } = await import('./userLogout'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('userLogout', () => {
	before(() => {
		mockModel('Users', { findOneById: findOneByIdStub });
	});

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
