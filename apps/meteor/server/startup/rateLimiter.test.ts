import { before, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';

const sandbox = sinon.createSandbox();

type Matcher = Record<string, unknown>;
type Input = { type: string; name: string; userId: string | null; connectionId: string; clientAddress: string; broadcastAuth?: boolean };

const settingValues = new Map<string, unknown>();
const watchers: [RegExp, () => void][] = [];
const addRule = sandbox.stub();
const removeRule = sandbox.stub();
const sessions = new Map<string, { connectionHandle: { broadcastAuth?: boolean } }>();

const DDPRateLimiter = {
	printRules: () => ({ existing: { _matchers: { type: 'method', name: 'login' } } }),
	addRule,
	removeRule,
	_increment: sandbox.stub(),
};

const matches = (matcher: Matcher, input: Input) =>
	Object.entries(matcher).every(([key, expected]) => {
		if (!(key in input)) {
			return false;
		}
		const value = input[key as keyof Input];
		return typeof expected === 'function' ? Boolean(expected(value)) : expected === value;
	});

const call = (overrides: Partial<Input> = {}): Input => {
	const input = {
		type: 'method',
		name: 'sendMessage',
		userId: 'user-id',
		connectionId: 'conn-1',
		clientAddress: '203.0.113.7',
		...overrides,
	};
	DDPRateLimiter._increment(input);
	return input;
};

describe('DDP rate limiter rules', () => {
	before(() => {
		addRule.callsFake(() => `rule-${addRule.callCount}`);
		p.noCallThru().load('./rateLimiter.js', {
			'underscore': { each: _.each, debounce: (fn: unknown) => fn },
			'meteor/ddp-rate-limiter': { DDPRateLimiter },
			'meteor/meteor': { Meteor: { bindEnvironment: (fn: unknown) => fn, server: { sessions } } },
			'meteor/rate-limit': { RateLimiter: class {} },
			'../lib/metrics': { metrics: {} },
			'../settings': {
				settings: {
					get: (key: string) => settingValues.get(key),
					watchByRegex: (regex: RegExp, callback: () => void) => watchers.push([regex, callback]),
				},
			},
		});
	});

	const configure = (limit: string, values: { enabled: boolean; allowed?: number; interval?: number }) => {
		sandbox.resetHistory();
		settingValues.set(`DDP_Rate_Limit_${limit}_Enabled`, values.enabled);
		settingValues.set(`DDP_Rate_Limit_${limit}_Requests_Allowed`, values.allowed);
		settingValues.set(`DDP_Rate_Limit_${limit}_Interval_Time`, values.interval);
		const setting = `DDP_Rate_Limit_${limit}_Enabled`;
		watchers.filter(([regex]) => regex.test(setting)).forEach(([, callback]) => callback());
		return addRule.args;
	};

	beforeEach(() => {
		sessions.clear();
	});

	it('should limit each address to the configured calls per interval, except the server itself', () => {
		const [[matcher, calls, interval]] = configure('IP', { enabled: true, allowed: 100, interval: 60000 });
		expect([calls, interval]).to.deep.equal([100, 60000]);
		expect(matches(matcher, call())).to.be.true;
		expect(matches(matcher, call({ clientAddress: '127.0.0.1' }))).to.be.false;
	});

	it('should never limit the internal connections that relay broadcasts between instances', () => {
		const [[matcher]] = configure('Connection', { enabled: true, allowed: 600, interval: 60000 });
		sessions.set('conn-internal', { connectionHandle: { broadcastAuth: true } });

		expect(matches(matcher, call({ connectionId: 'conn-internal' }))).to.be.false;
		expect(matches(matcher, call())).to.be.true;
	});

	it('should limit only logged-in users by user', () => {
		const [[matcher]] = configure('User', { enabled: true, allowed: 1200, interval: 60000 });
		expect(matches(matcher, call())).to.be.true;
		expect(matches(matcher, call({ userId: null }))).to.be.false;
	});

	it('should give stream subscriptions four times the per-method limit and leave methods with their own rule out', () => {
		const [[methodMatcher, methodCalls, methodInterval], [streamMatcher, streamCalls, streamInterval]] = configure('User_By_Method', {
			enabled: true,
			allowed: 20,
			interval: 10000,
		});
		expect([methodCalls, methodInterval]).to.deep.equal([20, 10000]);
		expect([streamCalls, streamInterval]).to.deep.equal([80, 40000]);

		expect(matches(methodMatcher, call())).to.be.true;
		expect(matches(methodMatcher, call({ name: 'login' }))).to.be.false;
		expect(matches(methodMatcher, call({ type: 'subscription', name: 'stream-room-messages' }))).to.be.false;
		expect(matches(streamMatcher, call({ type: 'subscription', name: 'stream-room-messages' }))).to.be.true;
		expect(matches(streamMatcher, call())).to.be.false;
	});

	it('should drop the limit when it is turned off and apply the new values when it is changed', () => {
		configure('IP', { enabled: true, allowed: 100, interval: 60000 });
		const [ruleId] = addRule.returnValues;

		configure('IP', { enabled: false });
		expect(removeRule.calledOnceWith(ruleId)).to.be.true;
		expect(addRule.called).to.be.false;

		const [[, calls, interval]] = configure('IP', { enabled: true, allowed: 50, interval: 1000 });
		expect([calls, interval]).to.deep.equal([50, 1000]);
	});
});
