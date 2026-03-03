import { Logger } from '@rocket.chat/logger';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { RateLimiter } from 'meteor/rate-limit';
import _ from 'underscore';

import { sleep } from '../../../../lib/utils/sleep';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';

const logger = new Logger('RateLimiter');

const slowDownRate = parseInt(process.env.RATE_LIMITER_SLOWDOWN_RATE || '0');

type RateLimiterInput = {
	connectionId: string;
	broadcastAuth?: boolean;
	userId?: string;
	clientAddress?: string;
	type: string;
	name: string;
};

type RateLimiterReply = {
	allowed: boolean;
	timeToReset: number;
	numInvocationsLeft: number;
	numInvocationsExceeded?: number;
};

const rateLimiterConsoleLog = ({ msg, reply, input }: { msg: string; reply: RateLimiterReply; input: RateLimiterInput }): void => {
	console.warn('DDP RATE LIMIT:', msg);
	console.warn(JSON.stringify({ reply, input }, null, 2));
};

const rateLimiterLogger = ({ msg, reply, input }: { msg: string; reply: RateLimiterReply; input: RateLimiterInput }): void =>
	logger.info({ msg, reply, input });

const rateLimiterLog = String(process.env.RATE_LIMITER_LOGGER) === 'console' ? rateLimiterConsoleLog : rateLimiterLogger;

// Get initial set of names already registered for rules
const names = new Set(
	Object.values((DDPRateLimiter as any).printRules())
		.map((rule: any) => rule._matchers)
		.filter((match: any) => typeof match.name === 'string')
		.map((match: any) => match.name),
);

// Override the addRule to save new names added after this point
const { addRule } = DDPRateLimiter;
DDPRateLimiter.addRule = (matcher: any, calls: number, time: number, callback?: any): string => {
	if (matcher && typeof matcher.name === 'string') {
		names.add(matcher.name);
	}
	return (addRule as any).call(DDPRateLimiter, matcher, calls, time, callback);
};

const { _increment } = DDPRateLimiter as any;
(DDPRateLimiter as any)._increment = function (input: RateLimiterInput) {
	const session = Meteor.server.sessions.get(input.connectionId);
	input.broadcastAuth = (session && (session as any).connectionHandle && (session as any).connectionHandle.broadcastAuth) === true;

	return _increment.call(DDPRateLimiter, input);
};

// Need to override the meteor's code duo to a problem with the callback reply
// being shared among all matchs
(RateLimiter.prototype as any).check = function (input: RateLimiterInput): RateLimiterReply {
	// ==== BEGIN OVERRIDE ====
	const session = Meteor.server.sessions.get(input.connectionId);
	input.broadcastAuth = (session && (session as any).connectionHandle && (session as any).connectionHandle.broadcastAuth) === true;
	// ==== END OVERRIDE ====

	const self = this as any;
	const reply: RateLimiterReply = {
		allowed: true,
		timeToReset: 0,
		numInvocationsLeft: Infinity,
	};

	const matchedRules = self._findAllMatchingRules(input);
	_.each(matchedRules, (rule: any) => {
		// ==== BEGIN OVERRIDE ====
		const callbackReply: RateLimiterReply = {
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

const checkNameNonStream = (name: string): boolean => !!(name && !names.has(name) && !name.startsWith('stream-'));
const checkNameForStream = (name: string): boolean => !!(name && !names.has(name) && name.startsWith('stream-'));

const ruleIds: Record<string, string> = {};

const callback =
	(msg: string, name: string) =>
	async (reply: RateLimiterReply, input: RateLimiterInput): Promise<void> => {
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
				await sleep(slowDownRate * reply.numInvocationsExceeded);
			}
			// } else {
			// 	console.log('DDP RATE LIMIT:', message);
			// 	console.log(JSON.stringify({ ...reply, ...input }, null, 2));
		}
	};

const messages: Record<string, string> = {
	IP: 'address',
	User: 'userId',
	Connection: 'connectionId',
	User_By_Method: 'userId per method',
	Connection_By_Method: 'connectionId per method',
};

const reconfigureLimit = Meteor.bindEnvironment((name: string, rules: any, factor = 1): void => {
	if (ruleIds[name + factor]) {
		DDPRateLimiter.removeRule(ruleIds[name + factor]);
	}

	if (!settings.get(`DDP_Rate_Limit_${name}_Enabled`)) {
		return;
	}

	ruleIds[name + factor] = (addRule as any)(
		rules,
		(settings.get(`DDP_Rate_Limit_${name}_Requests_Allowed`) as number) * factor,
		(settings.get(`DDP_Rate_Limit_${name}_Interval_Time`) as number) * factor,
		callback(`limit by ${messages[name]}`, name),
	);
});

const configIP = _.debounce((): void => {
	reconfigureLimit('IP', {
		broadcastAuth: false,
		clientAddress: (clientAddress: string): boolean => clientAddress !== '127.0.0.1',
	});
}, 1000);

const configUser = _.debounce((): void => {
	reconfigureLimit('User', {
		broadcastAuth: false,
		userId: (userId: string | undefined): boolean => userId != null,
	});
}, 1000);

const configConnection = _.debounce((): void => {
	reconfigureLimit('Connection', {
		broadcastAuth: false,
		connectionId: (): boolean => true,
	});
}, 1000);

const configUserByMethod = _.debounce((): void => {
	reconfigureLimit('User_By_Method', {
		broadcastAuth: false,
		type: (): boolean => true,
		name: checkNameNonStream,
		userId: (userId: string | undefined): boolean => userId != null,
	});
	reconfigureLimit(
		'User_By_Method',
		{
			broadcastAuth: false,
			type: (): boolean => true,
			name: checkNameForStream,
			userId: (userId: string | undefined): boolean => userId != null,
		},
		4,
	);
}, 1000);

const configConnectionByMethod = _.debounce((): void => {
	reconfigureLimit('Connection_By_Method', {
		broadcastAuth: false,
		type: (): boolean => true,
		name: checkNameNonStream,
		connectionId: (): boolean => true,
	});
	reconfigureLimit(
		'Connection_By_Method',
		{
			broadcastAuth: false,
			type: (): boolean => true,
			name: checkNameForStream,
			connectionId: (): boolean => true,
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
