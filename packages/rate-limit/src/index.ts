import { Random } from '@rocket.chat/random';

// Default time interval (in milliseconds) to reset rate limit counters
const DEFAULT_INTERVAL_TIME_IN_MILLISECONDS = 1000;
// Default number of events allowed per time interval
const DEFAULT_REQUESTS_PER_INTERVAL = 10;

const hasOwn = Object.prototype.hasOwnProperty;

// A rule is defined by an options object that contains two fields,
// `numRequestsAllowed` which is the number of events allowed per interval, and
// an `intervalTime` which is the amount of time in milliseconds before the
// rate limit restarts its internal counters, and by a matchers object. A
// matchers object is a POJO that contains a set of keys with values that
// define the entire set of inputs that match for each key. The values can
// either be null (optional), a primitive or a function that returns a boolean
// of whether the provided input's value matches for this key.
//
// Rules are uniquely assigned an `id` and they store a dictionary of counters,
// which are records used to keep track of inputs that match the rule. If a
// counter reaches the `numRequestsAllowed` within a given `intervalTime`, a
// rate limit is reached and future inputs that map to that counter will
// result in errors being returned to the client.

type RuleOptions = {
	numRequestsAllowed: number;
	intervalTime: number;
	callback?: (...args: any[]) => any;
};

type RuleMatcher = Record<string, ((input: any) => boolean | Promise<boolean>) | string>;

type CheckReply = {
	allowed: boolean;
	timeToReset: number;
	numInvocationsLeft: number;
	numInvocationsExceeded?: number;
};

type CheckInput = {
	IPAddr?: string;
	route?: string;
	userId?: string;
	clientAddress?: string;
	type?: string;
	name?: string;
	connectionId?: string;
	broadcastAuth?: boolean;
};

class Rule {
	id: string;

	options: RuleOptions;

	_matchers: RuleMatcher;

	_lastResetTime: number;

	counters: Record<string, number>;

	constructor(options: RuleOptions, matchers: RuleMatcher) {
		this.id = Random.id();

		this.options = options;

		this._matchers = matchers;

		this._lastResetTime = new Date().getTime();

		// Dictionary of input keys to counters
		this.counters = {};
	}

	// Determine if this rule applies to the given input by comparing all
	// rule.matchers. If the match fails, search short circuits instead of
	// iterating through all matchers.
	async match(input: Record<string, any>): Promise<boolean> {
		for await (const [key, matcher] of Object.entries(this._matchers)) {
			if (matcher !== null) {
				if (!hasOwn.call(input, key)) {
					return false;
				}
				if (typeof matcher === 'function') {
					if (!(await matcher(input[key]))) {
						return false;
					}
				} else if (matcher !== input[key]) {
					return false;
				}
			}
		}

		return true;
	}

	// Generates unique key string for provided input by concatenating all the
	// keys in the matcher with the corresponding values in the input.
	// Only called if rule matches input.
	_generateKeyString(input: CheckInput) {
		return Object.entries(this._matchers)
			.filter(([key]) => this._matchers[key] !== null)
			.reduce((returnString, [key, matcher]) => {
				if (typeof matcher === 'function') {
					if (matcher(input[key as keyof CheckInput])) {
						returnString += key + input[key as keyof CheckInput];
					}
				} else {
					returnString += key + input[key as keyof CheckInput];
				}
				return returnString;
			}, '');
	}

	// Applies the provided input and returns the key string, time since counters
	// were last reset and time to next reset.
	apply(input: CheckInput) {
		const key = this._generateKeyString(input);
		const timeSinceLastReset = new Date().getTime() - this._lastResetTime;
		const timeToNextReset = this.options.intervalTime - timeSinceLastReset;
		return {
			key,
			timeSinceLastReset,
			timeToNextReset,
		};
	}

	// Reset counter dictionary for this specific rule. Called once the
	// timeSinceLastReset has exceeded the intervalTime. _lastResetTime is
	// set to be the current time in milliseconds.
	resetCounter(): void {
		// Delete the old counters dictionary to allow for garbage collection
		this.counters = {};
		this._lastResetTime = new Date().getTime();
	}

	async _executeCallback(reply: CheckReply, ruleInput: CheckInput): Promise<void> {
		try {
			if (this.options.callback) {
				await this.options.callback(reply, ruleInput);
			}
		} catch (e) {
			// Do not throw error here
			console.error(e);
		}
	}
}

class RateLimiter {
	rules: Record<string, Rule>;

	// Initialize rules to be an empty dictionary.
	constructor() {
		// Dictionary of all rules associated with this RateLimiter, keyed by their
		// id. Each rule object stores the rule pattern, number of events allowed,
		// last reset time and the rule reset interval in milliseconds.

		this.rules = {};
	}

	/**
	 * Checks if this input has exceeded any rate limits.
	 * @param  {object} input dictionary containing key-value pairs of attributes
	 * that match to rules
	 * @return {object} Returns object of following structure
	 * { 'allowed': boolean - is this input allowed
	 *   'timeToReset': integer | Infinity - returns time until counters are reset
	 *                   in milliseconds
	 *   'numInvocationsLeft': integer | Infinity - returns number of calls left
	 *   before limit is reached
	 * }
	 * If multiple rules match, the least number of invocations left is returned.
	 * If the rate limit has been reached, the longest timeToReset is returned.
	 */
	async check(input: CheckInput, sessionInfo: { connectionHandle?: { broadcastAuth?: boolean } }): Promise<CheckReply> {
		// ==== BEGIN OVERRIDE ====
		const session = sessionInfo;
		input.broadcastAuth = session?.connectionHandle?.broadcastAuth === true;
		// ==== END OVERRIDE ====

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		const reply = {
			allowed: true,
			timeToReset: 0,
			numInvocationsLeft: Infinity,
		};

		const matchedRules = await self._findAllMatchingRules(input);
		for await (const rule of matchedRules) {
			const callbackReply: any = {
				allowed: true,
				timeToReset: 0,
				numInvocationsLeft: Infinity,
			};

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

				callbackReply.timeToReset = ruleResult.timeToNextReset;
				callbackReply.allowed = false;
				callbackReply.numInvocationsLeft = 0;
				callbackReply.numInvocationsExceeded = numInvocations - rule.options.numRequestsAllowed;
				await rule._executeCallback(callbackReply, input);
			} else {
				// If this is an allowed attempt and we haven't failed on any of the
				// other rules that match, update the reply field.
				if (rule.options.numRequestsAllowed - numInvocations < reply.numInvocationsLeft && reply.allowed) {
					reply.timeToReset = ruleResult.timeToNextReset;
					reply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
				}

				callbackReply.timeToReset = ruleResult.timeToNextReset;
				callbackReply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
				await rule._executeCallback(callbackReply, input);
			}
		}
		return reply;
	}

	/**
	 * Adds a rule to dictionary of rules that are checked against on every call.
	 * Only inputs that pass all of the rules will be allowed. Returns unique rule
	 * id that can be passed to `removeRule`.
	 * @param {object} rule    Input dictionary defining certain attributes and
	 * rules associated with them.
	 * Each attribute's value can either be a value, a function or null. All
	 * functions must return a boolean of whether the input is matched by that
	 * attribute's rule or not
	 * @param {integer} numRequestsAllowed Optional. Number of events allowed per
	 * interval. Default = 10.
	 * @param {integer} intervalTime Optional. Number of milliseconds before
	 * rule's counters are reset. Default = 1000.
	 * @param {function} callback Optional. Function to be called after a
	 * rule is executed. Two objects will be passed to this function.
	 * The first one is the result of RateLimiter.prototype.check
	 * The second is the input object of the rule, it has the following structure:
	 * {
	 *   'type': string - either 'method' or 'subscription'
	 *   'name': string - the name of the method or subscription being called
	 *   'userId': string - the user ID attempting the method or subscription
	 *   'connectionId': string - a string representing the user's DDP connection
	 *   'clientAddress': string - the IP address of the user
	 * }
	 * @return {string} Returns unique rule id
	 */
	addRule(rule: RuleMatcher, numRequestsAllowed?: number, intervalTime?: number, callback?: (...args: any[]) => any) {
		const options = {
			numRequestsAllowed: numRequestsAllowed || DEFAULT_REQUESTS_PER_INTERVAL,
			intervalTime: intervalTime || DEFAULT_INTERVAL_TIME_IN_MILLISECONDS,
			callback,
		};

		const newRule = new Rule(options, rule);
		this.rules[newRule.id] = newRule;
		return newRule.id;
	}

	/**
	 * Increment counters in every rule that match to this input
	 * @param  {object} input Dictionary object containing attributes that may
	 * match to rules
	 */
	async increment(input: CheckInput) {
		// Only increment rule counters that match this input
		const matchedRules = await this._findAllMatchingRules(input);
		matchedRules.forEach((rule) => {
			const ruleResult = rule.apply(input);

			if (ruleResult.timeSinceLastReset > rule.options.intervalTime) {
				// Reset all the counters since the rule has reset
				rule.resetCounter();
			}

			// Check whether the key exists, incrementing it if so or otherwise
			// adding the key and setting its value to 1
			if (hasOwn.call(rule.counters, ruleResult.key)) {
				rule.counters[ruleResult.key]++;
			} else {
				rule.counters[ruleResult.key] = 1;
			}
		});
	}

	// Returns an array of all rules that apply to provided input
	async _findAllMatchingRules(input: CheckInput) {
		// return Object.values(this.rules).filter((rule) => rule.match(input));
		// filter above to for await of

		const matchingRules = [];
		for await (const rule of Object.values(this.rules)) {
			if (await rule.match(input)) {
				matchingRules.push(rule);
			}
		}

		return matchingRules;
	}

	/**
	 * Provides a mechanism to remove rules from the rate limiter. Returns boolean
	 * about success.
	 * @param  {string} id Rule id returned from #addRule
	 * @return {boolean} Returns true if rule was found and deleted, else false.
	 */
	removeRule(id: string) {
		if (this.rules[id]) {
			delete this.rules[id];
			return true;
		}
		return false;
	}
}

export { RateLimiter, CheckInput };
