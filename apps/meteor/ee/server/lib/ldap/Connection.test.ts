import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import ldapjs from 'ldapjs';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loggerStub = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub(), warn: sinon.stub() };
const createClient = sinon.stub();

const { LDAPConnection } = proxyquire.noCallThru().load('./Connection', {
	'ldapjs': { ...ldapjs, createClient },
	'../../../../server/settings': { settings: { get: sinon.stub() } },
	'./getLDAPConditionalSetting': { getLDAPConditionalSetting: sinon.stub().returns('') },
	'./Logger': {
		logger: loggerStub,
		connLogger: loggerStub,
		bindLogger: loggerStub,
		searchLogger: loggerStub,
		authLogger: loggerStub,
		mapLogger: loggerStub,
	},
});

describe('LDAPConnection', () => {
	describe('synchronous errors from client.search (e.g. invalid filters)', () => {
		const parseError = new Error('invalid attribute name');
		let connection: any;

		beforeEach(() => {
			connection = new LDAPConnection();
			connection.options.userSearchField = 'uid';
			connection.client = { search: sinon.stub().throws(parseError) };
		});

		it('should reject doCustomSearch with the error', async () => {
			const error = await connection
				.doCustomSearch('dc=test', { filter: '(&(=*))' }, () => undefined)
				.then(
					() => undefined,
					(e: unknown) => e,
				);
			expect(error).to.equal(parseError);
		});

		it('should route the error to endCallback on paged searchAllUsers instead of leaking the throw', async () => {
			const endCallback = sinon.stub();
			await connection.searchAllUsers({ endCallback });
			expect(endCallback.calledOnceWithExactly(parseError)).to.be.true;
		});

		it('should route the error to endCallback on non-paged searchAllUsers instead of leaking the throw', async () => {
			connection.options.searchPageSize = 0;
			const endCallback = sinon.stub();
			await connection.searchAllUsers({ endCallback });
			expect(endCallback.calledOnceWithExactly(parseError)).to.be.true;
		});
	});

	describe('getUserFilter', () => {
		let connection: any;

		beforeEach(() => {
			connection = new LDAPConnection();
		});

		it('should compose the filter for a single search field', () => {
			connection.options.userSearchField = 'uid';
			expect(connection.getUserFilter('john')).to.equal('(&(uid=john))');
		});

		it('should compose an OR filter for multiple search fields', () => {
			connection.options.userSearchField = 'uid,sAMAccountName';
			expect(connection.getUserFilter('john')).to.equal('(&(|(uid=john)(sAMAccountName=john)))');
		});

		it('should trim whitespace and ignore empty segments (e.g. trailing commas)', () => {
			connection.options.userSearchField = ' uid , sAMAccountName ,';
			expect(connection.getUserFilter('john')).to.equal('(&(|(uid=john)(sAMAccountName=john)))');
		});

		it('should include the user search filter when configured', () => {
			connection.options.userSearchField = 'uid';
			connection.options.userSearchFilter = '(objectclass=user)';
			expect(connection.getUserFilter('*')).to.equal('(&(objectclass=user)(uid=*))');
		});

		it('should throw a configuration error when the search field is empty', () => {
			connection.options.userSearchField = '';
			expect(() => connection.getUserFilter('*')).to.throw('LDAP User Search Field is not configured');
		});

		it('should throw a configuration error when the search field only has empty segments', () => {
			connection.options.userSearchField = ' , ,';
			expect(() => connection.getUserFilter('*')).to.throw('LDAP User Search Field is not configured');
		});

		it('should reject searchAllUsers with the configuration error instead of composing an invalid filter', async () => {
			connection.options.userSearchField = '';
			connection.client = { search: sinon.stub() };
			const endCallback = sinon.stub();
			const error = await connection.searchAllUsers({ endCallback }).then(
				() => undefined,
				(e: unknown) => e,
			);
			expect(error).to.be.an('error').with.property('message', 'LDAP User Search Field is not configured');
			expect(connection.client.search.called).to.be.false;
		});
	});

	describe('bindAuthenticationUserOrFail', () => {
		const bindError = new Error('Invalid Credentials');
		let connection: any;

		beforeEach(() => {
			connection = new LDAPConnection();
			connection.client = { bind: sinon.stub().yields(null) };
			connection.options.authentication = true;
			connection.options.authenticationUserDN = 'cn=admin,dc=example,dc=com';
			connection.options.authenticationPassword = 'secret';
		});

		it('should bind with the authentication user when authentication is enabled', async () => {
			await connection.bindAuthenticationUserOrFail();
			sinon.assert.calledOnceWithMatch(connection.client.bind, 'cn=admin,dc=example,dc=com', 'secret');
		});

		it('should reject with the bind error when the bind fails', async () => {
			connection.client.bind.yields(bindError);
			const error = await connection.bindAuthenticationUserOrFail().then(
				() => undefined,
				(e: unknown) => e,
			);
			expect(error).to.equal(bindError);
		});

		it('should reject without binding when authentication is enabled and the user DN is empty', async () => {
			connection.options.authenticationUserDN = '';
			const error = await connection.bindAuthenticationUserOrFail().then(
				() => undefined,
				(e: unknown) => e,
			);
			expect(error).to.be.an('error').with.property('message', 'Invalid UserDN for authentication');
			sinon.assert.notCalled(connection.client.bind);
		});

		it('should not bind when authentication is disabled', async () => {
			connection.options.authentication = false;
			await connection.bindAuthenticationUserOrFail();
			sinon.assert.notCalled(connection.client.bind);
		});
	});

	describe('connect', () => {
		const certA = '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----';
		const certB = '-----BEGIN CERTIFICATE-----\nBBBB\n-----END CERTIFICATE-----';
		let clock: sinon.SinonFakeTimers;
		let client: EventEmitter & { starttls: sinon.SinonStub };
		let connection: any;

		beforeEach(() => {
			clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
			client = Object.assign(new EventEmitter(), { starttls: sinon.stub() });
			createClient.reset();
			createClient.returns(client);
			connection = new LDAPConnection();
			Object.assign(connection.options, { host: 'ldap.example', caCert: `${certA}\n${certB}\n` });
		});

		afterEach(() => {
			clock.restore();
		});

		it('should connect to ldaps:// with each certificate of the chain and the certificate-validation setting', async () => {
			Object.assign(connection.options, { port: 636, encryption: 'ssl', rejectUnauthorized: true });

			const connected = connection.connect();
			client.emit('connect');
			await connected;

			sinon.assert.calledOnceWithMatch(createClient, {
				url: 'ldaps://ldap.example:636',
				tlsOptions: { rejectUnauthorized: true, ca: [certA, certB] },
			});
			expect(connection.connected).to.be.true;
		});

		it('should start TLS with the host and the certificate chain', async () => {
			Object.assign(connection.options, { port: 389, encryption: 'tls', rejectUnauthorized: false });
			client.starttls.yields(null);

			await connection.connect();

			sinon.assert.calledOnceWithMatch(createClient, { url: 'ldap://ldap.example:389' });
			sinon.assert.calledOnceWithMatch(client.starttls, { host: 'ldap.example', ca: [certA, certB], rejectUnauthorized: false });
			expect(connection.connected).to.be.true;
		});

		it('should fail the connection when TLS cannot start', async () => {
			const tlsError = new Error('certificate has expired');
			connection.options.encryption = 'tls';
			client.starttls.yields(tlsError);

			const error = await connection.connect().then(
				() => undefined,
				(e: unknown) => e,
			);

			expect(error).to.equal(tlsError);
			expect(connection.connected).to.be.false;
		});

		it('should fail with a timeout when the server does not answer within the connection timeout', async () => {
			connection.options.connectionTimeout = 5000;
			let error: unknown;
			void connection.connect().catch((e: unknown) => {
				error = e;
			});

			await clock.tickAsync(4999);
			expect(error).to.be.undefined;

			await clock.tickAsync(1);
			expect(error).to.be.an('error').with.property('message', 'Timeout');
		});
	});

	describe('searchAllUsers (paged sync)', { timeout: 5000 }, () => {
		let connection: any;
		let res: EventEmitter;

		const entry = (uid: string) => ({ raw: { uid } });

		const serveDirectory = (pages: string[][]) => {
			const sendPage = (index: number) => {
				pages[index].forEach((uid) => res.emit('searchEntry', entry(uid)));
				if (index < pages.length - 1) {
					res.emit('page', {}, () => setImmediate(sendPage, index + 1));
					return;
				}
				res.emit('page', {});
				res.emit('end');
			};
			connection.client.search = sinon.stub().callsFake((_baseDN, _options, callback) => {
				callback(null, res);
				sendPage(0);
			});
		};

		beforeEach(() => {
			res = new EventEmitter();
			connection = new LDAPConnection();
			Object.assign(connection.options, { userSearchField: 'uid', searchPageSize: 2 });
			connection.client = { _updateIdle: sinon.stub() };
		});

		const syncUntilEnd = (entryCallback: (searchEntry: ldapjs.SearchEntry) => void, endCallback: sinon.SinonStub) =>
			new Promise<void>((resolve, reject) => {
				endCallback.callsFake(() => setImmediate(resolve));
				connection.searchAllUsers({ entryCallback, endCallback }).catch(reject);
			});

		it('should load every directory user once across several pages, and then finish once', async () => {
			serveDirectory([['alan.bean', 'buzz.aldrin'], ['david.scott', 'gene.cernan'], ['john.young']]);
			const imported: string[] = [];
			const endCallback = sinon.stub();

			await syncUntilEnd((searchEntry) => imported.push(connection.extractLdapEntryData(searchEntry).uid), endCallback);

			expect(imported).to.deep.equal(['alan.bean', 'buzz.aldrin', 'david.scott', 'gene.cernan', 'john.young']);
			sinon.assert.calledOnceWithExactly(endCallback);
		});

		it('should report a search failure during sync to the end callback', async () => {
			const searchError = new Error('Size limit exceeded');
			connection.client.search = sinon.stub().callsFake((_baseDN, _options, callback) => {
				callback(null, res);
				res.emit('searchEntry', entry('alan.bean'));
				res.emit('error', searchError);
			});
			const endCallback = sinon.stub();

			await connection.searchAllUsers({ endCallback });

			sinon.assert.calledOnceWithExactly(endCallback, searchError);
		});

		it('should still load the other users when one entry cannot be converted', async () => {
			serveDirectory([['alan.bean', 'broken.entry'], ['john.young']]);
			const imported: string[] = [];
			const endCallback = sinon.stub();

			await syncUntilEnd((searchEntry) => {
				const { uid } = connection.extractLdapEntryData(searchEntry);
				if (uid === 'broken.entry') {
					throw new Error('Username not found');
				}
				imported.push(uid);
			}, endCallback);

			expect(imported).to.deep.equal(['alan.bean', 'john.young']);
			sinon.assert.calledOnceWithExactly(endCallback);
		});
	});
});
