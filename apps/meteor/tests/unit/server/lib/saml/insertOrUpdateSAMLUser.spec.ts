import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { ISAMLUser } from '../../../../../server/lib/saml/definition/ISAMLUser';

const findOne = sinon.stub().resolves(null);

const globalSettings = {
	generateUsername: false,
	immutableProperty: 'EMail',
	nameOverwrite: false,
	mailOverwrite: false,
	channelsAttributeUpdate: false,
	defaultUserRole: 'user',
};

const { SAML } = proxyquire.noCallThru().load('../../../../../server/lib/saml/lib/SAML', {
	'@rocket.chat/models': {
		Users: { findOne },
		Rooms: {},
		Roles: { findInIdsOrNames: () => ({ toArray: async () => [] }) },
		CredentialTokens: {},
		SamlUsedAssertions: {},
	},
	'@rocket.chat/random': { Random: { id: () => 'random-id' } },
	'meteor/accounts-base': { Accounts: {} },
	'meteor/meteor': { Meteor: { Error, absoluteUrl: () => 'http://localhost:3000/' } },
	'./ServiceProvider': { SAMLServiceProvider: class {} },
	'./Utils': { SAMLUtils: { globalSettings, log: sinon.stub(), error: sinon.stub(), events: { emit: sinon.stub() } } },
	'./getSAMLEnvelope': { getSAMLEnvelope: sinon.stub() },
	'../../../../app/utils/lib/i18n': { i18n: { t: sinon.stub().returns('') } },
	'../../../settings': { settings: { get: sinon.stub().returns(false) } },
	'../../logger/system': { SystemLogger: { warn: sinon.stub(), error: sinon.stub() } },
	'../../rooms/addUserToRoom': { addUserToRoom: sinon.stub() },
	'../../rooms/createRoom': { createRoom: sinon.stub() },
	'../../users/getUsernameSuggestion': { generateUsernameSuggestion: sinon.stub() },
	'../../users/saveUserIdentity': { saveUserIdentity: sinon.stub() },
});

const makeUserObject = (emailList: string[]): ISAMLUser =>
	({
		samlLogin: { provider: 'provider', idp: 'idp', idpSession: 'session', nameID: 'nameID' },
		emailList,
		fullName: 'Full Name',
		username: 'username',
		attributeList: new Map(),
		identifier: { type: 'email' },
	}) as unknown as ISAMLUser;

// The lookup is the only part under test; user creation afterwards is out of scope, so failures past
// that point are swallowed and only the queries issued against Users are asserted.
const runLookup = async (emailList: string[]) => {
	findOne.resetHistory();
	await SAML.insertOrUpdateSAMLUser(makeUserObject(emailList)).catch(() => undefined);
	return findOne.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
};

describe('SAML insertOrUpdateSAMLUser', () => {
	beforeEach(() => {
		globalSettings.immutableProperty = 'EMail';
		findOne.resetHistory();
		findOne.resolves(null);
	});

	it('should not query for a user when the email list is empty', async () => {
		const queries = await runLookup([]);

		const emailQueries = queries.filter((query: Record<string, any>) => query && 'emails.address' in query);
		expect(emailQueries).to.have.lengthOf(0);
	});

	it('should never build an email pattern that matches an arbitrary address', async () => {
		for (const emailList of [[], [''], ['', ''], ['   ']]) {
			const queries = await runLookup(emailList);

			queries
				.filter((query: Record<string, any>) => query && query['emails.address'] instanceof RegExp)
				.forEach((query: Record<string, any>) => {
					const pattern: RegExp = query['emails.address'];
					expect(pattern.source, `pattern ${pattern} built from ${JSON.stringify(emailList)}`).to.not.equal('(?:)');
					expect(pattern.test('victim@example.com'), `pattern ${pattern} matched an unrelated address`).to.be.false;
				});
		}
	});

	it('should still look the user up by a single valid email', async () => {
		const queries = await runLookup(['valid@server.com']);

		const emailQueries = queries.filter((query: Record<string, any>) => query && query['emails.address'] instanceof RegExp);
		expect(emailQueries).to.have.lengthOf(1);

		const pattern: RegExp = emailQueries[0]['emails.address'];
		expect(pattern.test('valid@server.com')).to.be.true;
		expect(pattern.test('victim@example.com')).to.be.false;
	});

	it('should still look the user up by any of several valid emails', async () => {
		const queries = await runLookup(['first@server.com', 'second@server.com']);

		const emailQueries = queries.filter((query: Record<string, any>) => query && query['emails.address'] instanceof RegExp);
		expect(emailQueries).to.have.lengthOf(1);

		const pattern: RegExp = emailQueries[0]['emails.address'];
		expect(pattern.test('first@server.com')).to.be.true;
		expect(pattern.test('second@server.com')).to.be.true;
		expect(pattern.test('victim@example.com')).to.be.false;
	});
});
