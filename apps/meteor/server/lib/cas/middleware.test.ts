import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const settingValues = new Map<string, unknown>();
const validate = sandbox.stub();
const CredentialTokens = { create: sandbox.stub() };

const { middlewareCAS } = p.noCallThru().load('./middleware.ts', {
	'@rocket.chat/cas-validate': { validate },
	'../../settings': { settings: { get: (key: string) => settingValues.get(key) } },
	'../utils/getURL': { getWorkspaceURL: (path: string) => `https://chat.example.com/${path}` },
});

const request = (url: string) =>
	new Promise<{ next: sinon.SinonStub; body?: string }>((resolve) => {
		const next = sandbox.stub().callsFake(() => resolve({ next }));
		const res = {
			writeHead: sandbox.stub(),
			end: (body: string) => resolve({ next, body }),
		};
		middlewareCAS({ url }, res, next);
	});

const casAnswers = (...answer: unknown[]) => validate.callsFake((_options, _ticket, callback) => callback(...answer));

describe('middlewareCAS', () => {
	before(() => {
		mockModel('CredentialTokens', CredentialTokens);
	});

	beforeEach(() => {
		sandbox.reset();
		CredentialTokens.create.resolves();
		settingValues.clear();
		settingValues.set('CAS_enabled', true);
		settingValues.set('CAS_base_url', 'https://sso.example.com/cas');
		settingValues.set('CAS_version', '2.0');
	});

	it('should hand every other request to the next handler', async () => {
		const { next, body } = await request('/api/v1/me?x=1');

		expect(next.calledOnce).to.be.true;
		expect(body).to.be.undefined;
		expect(validate.called).to.be.false;
	});

	it('should close the login popup without validating when the URL carries no credential token', async () => {
		const { next, body } = await request('/_cas/?ticket=ST-1');

		expect(body).to.include('window.close()');
		expect(next.called).to.be.false;
		expect(validate.called).to.be.false;
	});

	it('should validate the ticket for this workspace and keep the CAS user and attributes under the credential token', async () => {
		casAnswers(undefined, true, 'alice', { attributes: { mail: ['alice@example.com'] } });

		const { body } = await request('/_cas/credential-token?ticket=ST-1');

		const [options, ticket] = validate.firstCall.args;
		expect(options).to.deep.equal({
			base_url: 'https://sso.example.com/cas',
			version: 2,
			service: 'https://chat.example.com/_cas/credential-token',
		});
		expect(ticket).to.equal('ST-1');
		expect(CredentialTokens.create.calledOnceWith('credential-token', { username: 'alice', attributes: { mail: ['alice@example.com'] } }))
			.to.be.true;
		expect(body).to.include('window.close()');
	});

	it('should keep only the username from a CAS 1.0 server', async () => {
		settingValues.set('CAS_version', '1.0');
		casAnswers(undefined, true, 'alice');

		await request('/_cas/credential-token?ticket=ST-1');

		expect(validate.firstCall.args[0].version).to.equal(1);
		expect(CredentialTokens.create.calledOnceWith('credential-token', { username: 'alice' })).to.be.true;
	});

	it('should store nothing when the CAS server rejects the ticket', async () => {
		casAnswers(undefined, false);

		const { body } = await request('/_cas/credential-token?ticket=ST-forged');

		expect(CredentialTokens.create.called).to.be.false;
		expect(body).to.include('window.close()');
	});

	it('should store nothing when the CAS server cannot be reached', async () => {
		casAnswers(new Error('ECONNREFUSED'));

		const { body } = await request('/_cas/credential-token?ticket=ST-1');

		expect(CredentialTokens.create.called).to.be.false;
		expect(body).to.include('window.close()');
	});

	it('should close the popup instead of failing the request when the CAS server URL is invalid', async () => {
		validate.throws(new Error('Only https CAS servers are supported.'));

		const { next, body } = await request('/_cas/credential-token?ticket=ST-1');

		expect(body).to.include('window.close()');
		expect(next.called).to.be.false;
		expect(CredentialTokens.create.called).to.be.false;
	});
});
