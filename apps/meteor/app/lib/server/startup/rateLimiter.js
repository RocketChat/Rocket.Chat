import { Logger } from '@rocket.chat/logger';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { RateLimiter } from 'meteor/rate-limit';
import _ from 'underscore';

import { sleep } from '../../../../lib/utils/sleep';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';

const logger = new Logger('RateLimiter');

const slowDownRate = parseInt(process.env.RATE_LIMITER_SLOWDOWN_RATE);

const rateLimiterConsoleLog = ({ msg, reply, input }) => {
	console.warn('DDP RATE LIMIT:', msg);
	console.warn(JSON.stringify({ reply, input }, null, 2));
};

const rateLimiterLogger = ({ msg, reply, input }) => logger.info({ msg, reply, input });

const rateLimiterLog = String(process.env.RATE_LIMITER_LOGGER) === 'console' ? rateLimiterConsoleLog : rateLimiterLogger;

// Get initial set of names already registered for rules
const names = new Set(
	Object.values(DDPRateLimiter.printRules())
		.map((rule) => rule._matchers)
		.filter((match) => typeof match.name === 'string')
		.map((match) => match.name),
);

// Override the addRule to save new names added after this point
const { addRule } = DDPRateLimiter;
DDPRateLimiter.addRule = (matcher, calls, time, callback) => {
	if (matcher && typeof matcher.name === 'string') {
		names.add(matcher.name);
	}
	return addRule.call(DDPRateLimiter, matcher, calls, time, callback);
};

const { _increment } = DDPRateLimiter;
DDPRateLimiter._increment = function (input) {
	const session = Meteor.server.sessions.get(input.connectionId);
	input.broadcastAuth = (session && session.connectionHandle && session.connectionHandle.broadcastAuth) === true;

	return _increment.call(DDPRateLimiter, input);
};

// Need to override the meteor's code duo to a problem with the callback reply
// being shared among all matchs
RateLimiter.prototype.check = function (input) {
	// ==== BEGIN OVERRIDE ====
	const session = Meteor.server.sessions.get(input.connectionId);
	input.broadcastAuth = (session && session.connectionHandle && session.connectionHandle.broadcastAuth) === true;
	// ==== END OVERRIDE ====

	const self = this;
	const reply = {
		allowed: true,
		timeToReset: 0,
		numInvocationsLeft: Infinity,
	};

	const matchedRules = self._findAllMatchingRules(input);
	_.each(matchedRules, (rule) => {
		// ==== BEGIN OVERRIDE ====
		const callbackReply = {
			allowed: true,
			timeToReset: 0,
			numInvocationsLeft: Infinity,
		};
		// ==== END OVERRIDE ====

		const ruleResult = rule.apply(input);
		let numInvocations = rule.counters[ruleResult.key];

		if (ruleResult.timeToNextReset < 0) {
			// Reset all the counters since the rule has reset
			rule.resetCounter();
			ruleResult.timeSinceLastReset = new Date().getTime() - rule._lastResetTime;
			ruleResult.timeToNextReset = rule.options.intervalTime;
			numInvocations = 0;
		}

		if (numInvocations > rule.options.numRequestsAllowed) {
			// Only update timeToReset if the new time would be longer than the
			// previously set time. This is to ensure that if this input triggers
			// multiple rules, we return the longest period of time until they can
			// successfully make another call
			if (reply.timeToReset < ruleResult.timeToNextReset) {
				reply.timeToReset = ruleResult.timeToNextReset;
			}
			reply.allowed = false;
			reply.numInvocationsLeft = 0;

			// ==== BEGIN OVERRIDE ====
			callbackReply.timeToReset = ruleResult.timeToNextReset;
			callbackReply.allowed = false;
			callbackReply.numInvocationsLeft = 0;
			callbackReply.numInvocationsExceeded = numInvocations - rule.options.numRequestsAllowed;
			rule._executeCallback(callbackReply, input);
			// ==== END OVERRIDE ====
		} else {
			// If this is an allowed attempt and we haven't failed on any of the
			// other rules that match, update the reply field.
			if (rule.options.numRequestsAllowed - numInvocations < reply.numInvocationsLeft && reply.allowed) {
				reply.timeToReset = ruleResult.timeToNextReset;
				reply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
			}

			// ==== BEGIN OVERRIDE ====
			callbackReply.timeToReset = ruleResult.timeToNextReset;
			callbackReply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
			rule._executeCallback(callbackReply, input);
			// ==== END OVERRIDE ====
		}
	});
	return reply;
};

const checkNameNonStream = (name) => name && !names.has(name) && !name.startsWith('stream-');
const checkNameForStream = (name) => name && !names.has(name) && name.startsWith('stream-');

const ruleIds = {};

const callback = (msg, name) => (reply, input) => {
	if (reply.allowed === false) {
		rateLimiterLog({ msg, reply, input });
		metrics.ddpRateLimitExceeded.inc({
			limit_name: name,
			user_id: input.userId,
			client_address: input.clientAddress,
			type: input.type,
			name: input.name,
			connection_id: input.connectionId,
		});
		// sleep before sending the error to slow down next requests
		if (slowDownRate > 0 && reply.numInvocationsExceeded) {
			Promise.await(sleep(slowDownRate * reply.numInvocationsExceeded));
		}
		// } else {
		// 	console.log('DDP RATE LIMIT:', message);
		// 	console.log(JSON.stringify({ ...reply, ...input }, null, 2));
	}
};

const messages = {
	IP: 'address',
	User: 'userId',
	Connection: 'connectionId',
	User_By_Method: 'userId per method',
	Connection_By_Method: 'connectionId per method',
};

const reconfigureLimit = Meteor.bindEnvironment((name, rules, factor = 1) => {
	if (ruleIds[name + factor]) {
		DDPRateLimiter.removeRule(ruleIds[name + factor]);
	}

	if (!settings.get(`DDP_Rate_Limit_${name}_Enabled`)) {
		return;
	}

	ruleIds[name + factor] = addRule(
		rules,
		settings.get(`DDP_Rate_Limit_${name}_Requests_Allowed`) * factor,
		settings.get(`DDP_Rate_Limit_${name}_Interval_Time`) * factor,
		callback(`limit by ${messages[name]}`, name),
	);
});

const configIP = _.debounce(() => {
	reconfigureLimit('IP', {
		broadcastAuth: false,
		clientAddress: (clientAddress) => clientAddress !== '127.0.0.1',
	});
}, 1000);

const configUser = _.debounce(() => {
	reconfigureLimit('User', {
		broadcastAuth: false,
		userId: (userId) => userId != null,
	});
}, 1000);

const configConnection = _.debounce(() => {
	reconfigureLimit('Connection', {
		broadcastAuth: false,
		connectionId: () => true,
	});
}, 1000);

const configUserByMethod = _.debounce(() => {
	reconfigureLimit('User_By_Method', {
		broadcastAuth: false,
		type: () => true,
		name: checkNameNonStream,
		userId: (userId) => userId != null,
	});
	reconfigureLimit(
		'User_By_Method',
		{
			broadcastAuth: false,
			type: () => true,
			name: checkNameForStream,
			userId: (userId) => userId != null,
		},
		4,
	);
}, 1000);

const configConnectionByMethod = _.debounce(() => {
	reconfigureLimit('Connection_By_Method', {
		broadcastAuth: false,
		type: () => true,
		name: checkNameNonStream,
		connectionId: () => true,
	});
	reconfigureLimit(
		'Connection_By_Method',
		{
			broadcastAuth: false,
			type: () => true,
			name: checkNameForStream,
			connectionId: () => true,
		},
		4,
	);
}, 1000);

if (!process.env.TEST_MODE) {
	settings.watchByRegex(/^DDP_Rate_Limit_IP_.+/, configIP);
	settings.watchByRegex(/^DDP_Rate_Limit_User_[^B].+/, configUser);
	settings.watchByRegex(/^DDP_Rate_Limit_Connection_[^B].+/, configConnection);
	settings.watchByRegex(/^DDP_Rate_Limit_User_By_Method_.+/, configUserByMethod);
	settings.watchByRegex(/^DDP_Rate_Limit_Connection_By_Method_.+/, configConnectionByMethod);
}
