import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type Env = { TEST_MODE?: string; ROCKET_CHAT_DEPRECATION_THROW_ERRORS_FOR_VERSIONS_UNDER?: string };

const ENV_KEYS = ['TEST_MODE', 'ROCKET_CHAT_DEPRECATION_THROW_ERRORS_FOR_VERSIONS_UNDER'] as const;

const setEnv = (env: Env) => {
	for (const key of ENV_KEYS) {
		if (env[key] === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = env[key];
		}
	}
};

// The module reads its environment once, at load time, so each scenario loads a fresh copy under its own
// environment, and the shared process gets its environment back as soon as the copy is loaded.
const loadLogger = (env: Env = {}) => {
	const previousEnv: Env = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
	const warn: Record<string, sinon.SinonStub> = {};
	const metrics = {
		deprecations: { inc: sinon.stub() },
		deprecationsTotal: { inc: sinon.stub() },
	};

	setEnv(env);
	try {
		const module = proxyquire.noCallThru().load('./deprecationWarningLogger', {
			'@rocket.chat/logger': {
				Logger: class {
					section(name: string) {
						warn[name] = sinon.stub();
						return { warn: warn[name] };
					}
				},
			},
			'./metrics/lib/metrics': { metrics },
		});

		return { ...module, warn, metrics };
	} finally {
		setEnv(previousEnv);
	}
};

const deprecationHeaders = (res: Response) => ({
	type: res.headers.get('x-deprecation-type'),
	message: res.headers.get('x-deprecation-message'),
	version: res.headers.get('x-deprecation-version'),
});

const NO_DEPRECATION_HEADERS = { type: null, message: null, version: null };

const expectNothingRecorded = ({ warn, metrics }: ReturnType<typeof loadLogger>) => {
	expect(warn.API.called).to.be.false;
	expect(warn.METHOD.called).to.be.false;
	expect(metrics.deprecations.inc.called).to.be.false;
	expect(metrics.deprecationsTotal.inc.called).to.be.false;
};

describe('deprecationWarningLogger', () => {
	describe('apiDeprecationLogger', () => {
		describe('endpoint', () => {
			it('should warn, set the deprecation headers and count the deprecated endpoint', () => {
				const logger = loadLogger();
				const res = new Response();

				logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', res);

				const message = 'The endpoint "/v1/foo" is deprecated and will be removed on version 9.0.0';
				expect(deprecationHeaders(res)).to.deep.equal({ type: 'endpoint-deprecation', message, version: '9.0.0' });
				expect(logger.warn.API.calledOnceWithExactly({ msg: message, endpoint: '/v1/foo', version: '9.0.0', info: '' })).to.be.true;
				const labels = { type: 'deprecation', kind: 'endpoint', name: '/v1/foo' };
				expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
				expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			});

			it('should append the extra information to the message', () => {
				const logger = loadLogger();
				const res = new Response();

				logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', res, 'use /v1/bar instead');

				const message = 'The endpoint "/v1/foo" is deprecated and will be removed on version 9.0.0 (use /v1/bar instead)';
				expect(res.headers.get('x-deprecation-message')).to.equal(message);
				expect(logger.warn.API.firstCall.args[0]).to.include({ msg: message, info: 'use /v1/bar instead' });
			});

			it('should still warn and count when there is no response to write headers to', () => {
				const logger = loadLogger();

				logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', undefined);

				expect(logger.warn.API.calledOnce).to.be.true;
				expect(logger.metrics.deprecations.inc.calledOnce).to.be.true;
			});
		});

		describe('parameter', () => {
			it('should warn, set the deprecation headers and count the deprecated parameter', () => {
				const logger = loadLogger();
				const res = new Response();

				logger.apiDeprecationLogger.parameter('/v1/foo', 'bar', '9.0.0', res);

				const message = 'The parameter "bar" in the endpoint "/v1/foo" is deprecated and will be removed on version 9.0.0';
				expect(deprecationHeaders(res)).to.deep.equal({ type: 'parameter-deprecation', message, version: '9.0.0' });
				expect(logger.warn.API.calledOnceWithExactly({ msg: message, endpoint: '/v1/foo', parameter: 'bar', version: '9.0.0' })).to.be.true;
				const labels = { type: 'parameter-deprecation', kind: 'endpoint', name: '/v1/foo', params: 'bar' };
				expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
				expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			});

			it('should use the message built by a custom message generator', () => {
				const logger = loadLogger();
				const res = new Response();
				const messageGenerator = sinon.stub().returns('custom parameter message');

				logger.apiDeprecationLogger.parameter('/v1/foo', 'bar', '9.0.0', res, messageGenerator);

				expect(messageGenerator.calledOnceWithExactly({ parameter: 'bar', endpoint: '/v1/foo', version: '9.0.0' })).to.be.true;
				expect(res.headers.get('x-deprecation-message')).to.equal('custom parameter message');
				expect(logger.warn.API.firstCall.args[0]).to.include({ msg: 'custom parameter message' });
			});
		});

		describe('deprecatedParameterUsage', () => {
			it('should warn, set the deprecation headers and count the deprecated usage', () => {
				const logger = loadLogger();
				const res = new Response();

				logger.apiDeprecationLogger.deprecatedParameterUsage('/v1/foo', 'bar', '9.0.0', res);

				const message = 'The usage of the endpoint "/v1/foo" is deprecated and will be removed on version 9.0.0';
				expect(deprecationHeaders(res)).to.deep.equal({ type: 'invalid-usage', message, version: '9.0.0' });
				expect(logger.warn.API.calledOnceWithExactly({ msg: message, endpoint: '/v1/foo', parameter: 'bar', version: '9.0.0' })).to.be.true;
				const labels = { type: 'invalid-usage', kind: 'endpoint', name: '/v1/foo', params: 'bar' };
				expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
				expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			});

			it('should use the message built by a custom message generator', () => {
				const logger = loadLogger();
				const res = new Response();
				const messageGenerator = sinon.stub().returns('custom usage message');

				logger.apiDeprecationLogger.deprecatedParameterUsage('/v1/foo', 'bar', '9.0.0', res, messageGenerator);

				expect(messageGenerator.calledOnceWithExactly({ parameter: 'bar', endpoint: '/v1/foo', version: '9.0.0' })).to.be.true;
				expect(res.headers.get('x-deprecation-message')).to.equal('custom usage message');
			});
		});
	});

	describe('methodDeprecationLogger', () => {
		describe('method', () => {
			it('should point to a single replacement endpoint', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.method('getFoo', '9.0.0', '/v1/foo');

				const replacement = 'Use the "/v1/foo" endpoint instead';
				expect(
					logger.warn.METHOD.calledOnceWithExactly({
						msg: `The method "getFoo" is deprecated and will be removed on version 9.0.0 (${replacement})`,
						method: 'getFoo',
						version: '9.0.0',
						replacement,
					}),
				).to.be.true;
				const labels = { type: 'deprecation', name: 'getFoo', kind: 'method' };
				expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
				expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			});

			it('should list every replacement endpoint', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.method('getFoo', '9.0.0', ['/v1/foo', '/v1/bar']);

				expect(logger.warn.METHOD.firstCall.args[0]).to.include({
					msg: 'The method "getFoo" is deprecated and will be removed on version 9.0.0 (Use the "/v1/foo" or "/v1/bar" endpoints instead)',
					replacement: 'Use the "/v1/foo" or "/v1/bar" endpoints instead',
				});
			});

			it('should leave a replacement that is not a path unquoted', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.method('getFoo', '9.0.0', 'foo.get');

				expect(logger.warn.METHOD.firstCall.args[0]).to.include({ replacement: 'Use the foo.get endpoint instead' });
			});

			it('should omit the replacement guidance when there is no replacement', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.method('getFoo', '9.0.0', []);

				expect(logger.warn.METHOD.firstCall.args[0]).to.include({
					msg: 'The method "getFoo" is deprecated and will be removed on version 9.0.0',
					replacement: '',
				});
			});
		});

		describe('parameter', () => {
			it('should warn and count the deprecated method parameter', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.parameter('getFoo', 'bar', '9.0.0');

				expect(
					logger.warn.METHOD.calledOnceWithExactly({
						msg: 'The parameter "bar" in the method "getFoo" is deprecated and will be removed on version 9.0.0',
						method: 'getFoo',
						parameter: 'bar',
						version: '9.0.0',
					}),
				).to.be.true;
				const labels = { type: 'parameter-deprecation', name: 'getFoo', params: 'bar' };
				expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
				expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			});
		});

		describe('deprecatedParameterUsage', () => {
			it('should warn and count the deprecated method usage', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.deprecatedParameterUsage('getFoo', 'bar', '9.0.0');

				expect(
					logger.warn.METHOD.calledOnceWithExactly({
						msg: 'The usage of the method "getFoo" is deprecated and will be removed on version 9.0.0',
						method: 'getFoo',
						parameter: 'bar',
						version: '9.0.0',
					}),
				).to.be.true;
				const labels = { type: 'invalid-usage', name: 'getFoo', params: 'bar', kind: 'method' };
				expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
				expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			});

			it('should use the message built by a custom message generator', () => {
				const logger = loadLogger();
				const messageGenerator = sinon.stub().returns('custom method usage message');

				logger.methodDeprecationLogger.deprecatedParameterUsage('getFoo', 'bar', '9.0.0', messageGenerator);

				expect(messageGenerator.calledOnceWithExactly({ parameter: 'bar', method: 'getFoo', version: '9.0.0' })).to.be.true;
				expect(logger.warn.METHOD.firstCall.args[0]).to.include({ msg: 'custom method usage message' });
			});
		});

		describe('warn', () => {
			it('should log the given message as is', () => {
				const logger = loadLogger();

				logger.methodDeprecationLogger.warn('something old was used');

				expect(logger.warn.METHOD.calledOnceWithExactly({ msg: 'something old was used' })).to.be.true;
			});
		});
	});

	describe('when TEST_MODE=true', () => {
		it('should throw for a deprecated endpoint before writing headers, counting or warning', () => {
			const logger = loadLogger({ TEST_MODE: 'true' });
			const res = new Response();

			expect(() => logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', res)).to.throw(
				'The endpoint "/v1/foo" is deprecated and will be removed on version 9.0.0',
			);
			expectNothingRecorded(logger);
			expect(deprecationHeaders(res)).to.deep.equal(NO_DEPRECATION_HEADERS);
		});

		it('should throw for a deprecated endpoint parameter before writing headers, counting or warning', () => {
			const logger = loadLogger({ TEST_MODE: 'true' });
			const res = new Response();

			expect(() => logger.apiDeprecationLogger.parameter('/v1/foo', 'bar', '9.0.0', res)).to.throw(
				'The parameter "bar" in the endpoint "/v1/foo" is deprecated',
			);
			expectNothingRecorded(logger);
			expect(deprecationHeaders(res)).to.deep.equal(NO_DEPRECATION_HEADERS);
		});

		it('should throw for a deprecated endpoint usage before writing headers, counting or warning', () => {
			const logger = loadLogger({ TEST_MODE: 'true' });
			const res = new Response();

			expect(() => logger.apiDeprecationLogger.deprecatedParameterUsage('/v1/foo', 'bar', '9.0.0', res)).to.throw(
				'The usage of the endpoint "/v1/foo" is deprecated',
			);
			expectNothingRecorded(logger);
			expect(deprecationHeaders(res)).to.deep.equal(NO_DEPRECATION_HEADERS);
		});

		it('should throw for every method deprecation without counting or warning', () => {
			const logger = loadLogger({ TEST_MODE: 'true' });

			expect(() => logger.methodDeprecationLogger.method('getFoo', '9.0.0', '/v1/foo')).to.throw('The method "getFoo" is deprecated');
			expect(() => logger.methodDeprecationLogger.parameter('getFoo', 'bar', '9.0.0')).to.throw(
				'The parameter "bar" in the method "getFoo" is deprecated',
			);
			expect(() => logger.methodDeprecationLogger.deprecatedParameterUsage('getFoo', 'bar', '9.0.0')).to.throw(
				'The usage of the method "getFoo" is deprecated',
			);
			expect(() => logger.methodDeprecationLogger.warn('something old was used')).to.throw('something old was used');
			expectNothingRecorded(logger);
		});
	});

	describe('when TEST_MODE=api', () => {
		it('should warn instead of throwing', () => {
			const logger = loadLogger({ TEST_MODE: 'api' });
			const res = new Response();

			expect(() => logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', res)).not.to.throw();
			expect(() => logger.methodDeprecationLogger.method('getFoo', '9.0.0', '/v1/foo')).not.to.throw();

			expect(res.headers.get('x-deprecation-type')).to.equal('endpoint-deprecation');
			expect(logger.warn.API.calledOnce).to.be.true;
			expect(logger.warn.METHOD.calledOnce).to.be.true;
		});
	});

	describe('when ROCKET_CHAT_DEPRECATION_THROW_ERRORS_FOR_VERSIONS_UNDER is set', () => {
		const withThreshold = (threshold: string) => loadLogger({ ROCKET_CHAT_DEPRECATION_THROW_ERRORS_FOR_VERSIONS_UNDER: threshold });

		it('should warn when the removal version is above the threshold', () => {
			const logger = withThreshold('8.0.0');
			const res = new Response();

			expect(() => logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', res)).not.to.throw();
			expect(logger.warn.API.calledOnce).to.be.true;
		});

		it('should throw when the removal version equals the threshold', () => {
			const logger = withThreshold('9.0.0');
			const res = new Response();

			expect(() => logger.apiDeprecationLogger.endpoint('/v1/foo', '9.0.0', res)).to.throw(
				'The endpoint "/v1/foo" is deprecated and will be removed on version 9.0.0',
			);
			expectNothingRecorded(logger);
			expect(deprecationHeaders(res)).to.deep.equal(NO_DEPRECATION_HEADERS);
		});

		it('should throw when the removal version is below the threshold', () => {
			const logger = withThreshold('10.0.0');

			expect(() => logger.apiDeprecationLogger.parameter('/v1/foo', 'bar', '9.0.0', new Response())).to.throw(
				'The parameter "bar" in the endpoint "/v1/foo" is deprecated',
			);
			expect(() => logger.apiDeprecationLogger.deprecatedParameterUsage('/v1/foo', 'bar', '9.0.0', new Response())).to.throw(
				'The usage of the endpoint "/v1/foo" is deprecated',
			);
			expect(() => logger.methodDeprecationLogger.method('getFoo', '9.0.0', [])).to.throw('The method "getFoo" is deprecated');
			expect(() => logger.methodDeprecationLogger.deprecatedParameterUsage('getFoo', 'bar', '9.0.0')).to.throw(
				'The usage of the method "getFoo" is deprecated',
			);
			expect(logger.warn.API.called).to.be.false;
			expect(logger.warn.METHOD.called).to.be.false;
		});

		it('should count a deprecated method parameter before throwing for it', () => {
			const logger = withThreshold('9.0.0');

			expect(() => logger.methodDeprecationLogger.parameter('getFoo', 'bar', '9.0.0')).to.throw(
				'The parameter "bar" in the method "getFoo" is deprecated',
			);

			const labels = { type: 'parameter-deprecation', name: 'getFoo', params: 'bar' };
			expect(logger.metrics.deprecations.inc.calledOnceWithExactly(labels)).to.be.true;
			expect(logger.metrics.deprecationsTotal.inc.calledOnceWithExactly(labels)).to.be.true;
			expect(logger.warn.METHOD.called).to.be.false;
		});

		it('should always throw for the legacy warn entry point', () => {
			const logger = withThreshold('8.0.0');

			expect(() => logger.methodDeprecationLogger.warn('something old was used')).to.throw('something old was used');
			expect(logger.warn.METHOD.called).to.be.false;
		});
	});
});
