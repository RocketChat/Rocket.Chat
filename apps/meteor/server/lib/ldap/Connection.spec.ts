import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loggerStub = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub(), warn: sinon.stub() };

const { LDAPConnection } = proxyquire.noCallThru().load('./Connection', {
	'../../settings': { settings: { get: sinon.stub() } },
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
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(endCallback.calledOnceWithExactly(parseError)).to.be.true;
		});

		it('should route the error to endCallback on non-paged searchAllUsers instead of leaking the throw', async () => {
			connection.options.searchPageSize = 0;
			const endCallback = sinon.stub();
			await connection.searchAllUsers({ endCallback });
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(connection.client.search.called).to.be.false;
		});
	});

	describe('testConnection', () => {
		const bindError = new Error('Invalid Credentials');
		let connection: any;

		beforeEach(() => {
			connection = new LDAPConnection();
			connection.connect = sinon.stub().resolves();
			connection.client = { bind: sinon.stub().yields(null), unbind: sinon.stub() };
			connection.options.authentication = true;
			connection.options.authenticationUserDN = 'cn=admin,dc=example,dc=com';
			connection.options.authenticationPassword = 'secret';
		});

		it('should bind with the authentication user when authentication is enabled', async () => {
			await connection.testConnection();
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(connection.client.bind.calledOnceWith('cn=admin,dc=example,dc=com', 'secret')).to.be.true;
		});

		it('should reject with the bind error when the bind fails', async () => {
			connection.client.bind.yields(bindError);
			const error = await connection.testConnection().then(
				() => undefined,
				(e: unknown) => e,
			);
			expect(error).to.equal(bindError);
		});

		it('should reject without binding when authentication is enabled and the user DN is empty', async () => {
			connection.options.authenticationUserDN = '';
			const error = await connection.testConnection().then(
				() => undefined,
				(e: unknown) => e,
			);
			expect(error).to.be.an('error').with.property('message', 'LDAP_Authentication_UserDN_empty');
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(connection.client.bind.called).to.be.false;
		});

		it('should not bind when authentication is disabled', async () => {
			connection.options.authentication = false;
			await connection.testConnection();
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(connection.client.bind.called).to.be.false;
		});

		it('should disconnect even when the bind fails', async () => {
			connection.client.bind.yields(bindError);
			await connection.testConnection().catch(() => undefined);
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(connection.client.unbind.calledOnce).to.be.true;
		});
	});
});
