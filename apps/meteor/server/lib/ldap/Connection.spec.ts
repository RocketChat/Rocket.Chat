import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loggerStub = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub(), warn: sinon.stub() };

const { LDAPConnection } = proxyquire.noCallThru().load('./Connection', {
	'../../../app/settings/server': { settings: { get: sinon.stub() } },
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
});
