import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const mocks = {
	logger: {
		debug: sandbox.stub(),
		warn: sandbox.stub(),
		error: sandbox.stub(),
	},
	ApnProvider: sandbox.stub(),
};

const apnMock = {
	'Provider': mocks.ApnProvider,
	'Notification': sandbox.stub(),
	'@noCallThru': true,
};

const { initAPN } = proxyquire.noCallThru().load('./apn', {
	'@parse/node-apn': {
		default: apnMock,
		...apnMock,
	},
	'./logger': { logger: mocks.logger },
});

const baseOptions = {
	apn: {
		cert: 'cert-data',
		key: 'key-data',
		gateway: undefined as string | undefined,
	},
	production: false,
};

const buildOptions = (overrides: Record<string, unknown> = {}, apnOverrides: Record<string, unknown> = {}) => ({
	...baseOptions,
	...overrides,
	apn: {
		...baseOptions.apn,
		...apnOverrides,
	},
});

describe('initAPN', () => {
	beforeEach(() => {
		sandbox.resetHistory();
		mocks.ApnProvider.reset();
	});

	describe('APN provider initialization', () => {
		it('should create apn.Provider with correct options', () => {
			const options = buildOptions({ production: true }, { gateway: 'gateway.push.apple.com' });

			initAPN({
				options,
				absoluteUrl: 'https://example.com',
			});

			expect(mocks.ApnProvider.calledWithNew()).to.be.true;
		});

		it('should pass production flag from options to Provider', () => {
			initAPN({
				options: buildOptions({ production: true }),
				absoluteUrl: 'https://example.com',
			});

			expect(mocks.ApnProvider.firstCall.args[0]).to.have.property('production', true);
		});

		it('should pass production false when options.production is false', () => {
			initAPN({
				options: buildOptions({ production: false }),
				absoluteUrl: 'https://example.com',
			});

			expect(mocks.ApnProvider.firstCall.args[0]).to.have.property('production', false);
		});

		it('should pass cert and key to Provider', () => {
			initAPN({
				options: buildOptions({}, { cert: 'my-cert', key: 'my-key' }),
				absoluteUrl: 'https://example.com',
			});

			const providerArgs = mocks.ApnProvider.firstCall.args[0];
			expect(providerArgs).to.have.property('cert', 'my-cert');
			expect(providerArgs).to.have.property('key', 'my-key');
		});

		it('should pass gateway to Provider when specified', () => {
			initAPN({
				options: buildOptions({}, { gateway: 'gateway.push.apple.com' }),
				absoluteUrl: 'https://example.com',
			});

			expect(mocks.ApnProvider.firstCall.args[0]).to.have.property('gateway', 'gateway.push.apple.com');
		});

		it('should spread all apn options to Provider', () => {
			initAPN({
				options: buildOptions({ production: true }, { cert: 'c', key: 'k', gateway: 'gateway.sandbox.push.apple.com' }),
				absoluteUrl: 'https://example.com',
			});

			const providerArgs = mocks.ApnProvider.firstCall.args[0];
			expect(providerArgs).to.deep.equal({
				cert: 'c',
				key: 'k',
				gateway: 'gateway.sandbox.push.apple.com',
				production: true,
			});
		});

		it('should not throw when Provider constructor throws', () => {
			mocks.ApnProvider.throws(new Error('APN init failed'));

			expect(() =>
				initAPN({
					options: buildOptions(),
					absoluteUrl: 'https://example.com',
				}),
			).to.not.throw();
		});
	});
});
