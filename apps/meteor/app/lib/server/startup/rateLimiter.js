import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from '@rocket.chat/ddp-rate-limit';

import { settings } from '../../../settings/server';
import { metrics } from '../../../metrics/server';
import { Logger } from '../../../logger/server';
import { sleep } from '../../../../lib/utils/sleep';

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

const checkNameNonStream = (name) => name && !names.has(name) && !name.startsWith('stream-');
const checkNameForStream = (name) => name && !names.has(name) && name.startsWith('stream-');

const ruleIds = {};

const callback = (msg, name) => async (reply, input) => {
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
