/* Port of meteor/rate-limit (packages/rate-limit/rate-limit.js @ METEOR@3.4.1) */
import { Random } from '@rocket.chat/random';

import { Meteor } from './meteor.ts';

// Default time interval (in milliseconds) to reset rate limit counters
const DEFAULT_INTERVAL_TIME_IN_MILLISECONDS = 1000;
// Default number of events allowed per time interval
const DEFAULT_REQUESTS_PER_INTERVAL = 10;

const hasOwn = Object.prototype.hasOwnProperty;

type Matcher = null | string | number | boolean | ((value: any) => boolean | Promise<boolean>);
type Matchers = Record<string, Matcher>;
type RuleOptions = {
	numRequestsAllowed: number;
	intervalTime: number;
	callback?: (reply: RateLimiterReply, input: Record<string, any>) => void;
};

export type RateLimiterReply = {
	allowed: boolean;
	timeToReset: number;
	numInvocationsLeft: number;
	ruleId?: string;
};

class Rule {
	public id: string;

	public options: RuleOptions;

	public counters: Record<string, number> = {};

	public _matchers: Matchers;

	public _lastResetTime: number;

	constructor(options: RuleOptions, matchers: Matchers) {
		this.id = Random.id();
		this.options = options;
		this._matchers = matchers;
		this._lastResetTime = new Date().getTime();
	}

	match(input: Record<string, any>): boolean {
		return Object.entries(this._matchers).every(([key, matcher]) => {
			if (matcher !== null) {
				if (!hasOwn.call(input, key)) {
					return false;
				} else if (typeof matcher === 'function') {
					if (!matcher(input[key])) {
						return false;
					}
				} else if (matcher !== input[key]) {
					return false;
				}
			}
			return true;
		});
	}

	async matchAsync(input: Record<string, any>): Promise<boolean> {
		for (const [key, matcher] of Object.entries(this._matchers)) {
			if (matcher !== null) {
				if (!hasOwn.call(input, key)) {
					return false;
				} else if (typeof matcher === 'function') {
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

	_generateKeyString(input: Record<string, any>): string {
		return Object.entries(this._matchers)
			.filter(([key]) => this._matchers[key] !== null)
			.reduce((returnString, [key, matcher]) => {
				if (typeof matcher === 'function') {
					if (matcher(input[key])) {
						returnString += key + input[key];
					}
				} else {
					returnString += key + input[key];
				}
				return returnString;
			}, '');
	}

	apply(input: Record<string, any>): { key: string; timeSinceLastReset: number; timeToNextReset: number } {
		const key = this._generateKeyString(input);
		const timeSinceLastReset = new Date().getTime() - this._lastResetTime;
		const timeToNextReset = this.options.intervalTime - timeSinceLastReset;
		return {
			key,
			timeSinceLastReset,
			timeToNextReset,
		};
	}

	resetCounter(): void {
		// Delete the old counters dictionary to allow for garbage collection
		this.counters = {};
		this._lastResetTime = new Date().getTime();
	}

	_executeCallback(reply: RateLimiterReply, ruleInput: Record<string, any>): void {
		try {
			if (this.options.callback) {
				this.options.callback(reply, ruleInput);
			}
		} catch (e) {
			// Do not throw error here
			console.error(e);
		}
	}
}

class RateLimiter {
	public rules: Record<string, Rule> = {};

	check(input: Record<string, any>): RateLimiterReply {
		const reply: RateLimiterReply = {
			allowed: true,
			timeToReset: 0,
			numInvocationsLeft: Infinity,
		};

		const matchedRules = this._findAllMatchingRules(input);
		matchedRules.forEach((rule) => {
			const ruleResult = rule.apply(input);
			this._handleRuleResult(rule, ruleResult, reply, input);
		});
		return reply;
	}

	checkRules(rules: Rule[], input: Record<string, any>): RateLimiterReply {
		const reply: RateLimiterReply = {
			allowed: true,
			timeToReset: 0,
			numInvocationsLeft: Infinity,
		};

		rules.forEach((rule) => {
			const ruleResult = rule.apply(input);
			this._handleRuleResult(rule, ruleResult, reply, input);
		});
		return reply;
	}

	_handleRuleResult(
		rule: Rule,
		ruleResult: { key: string; timeSinceLastReset: number; timeToNextReset: number },
		reply: RateLimiterReply,
		input: Record<string, any>,
	): void {
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
			reply.ruleId = rule.id;
			rule._executeCallback(reply, input);
		} else {
			// If this is an allowed attempt and we haven't failed on any of the
			// other rules that match, update the reply field.
			if (rule.options.numRequestsAllowed - numInvocations < reply.numInvocationsLeft && reply.allowed) {
				reply.timeToReset = ruleResult.timeToNextReset;
				reply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
			}
			reply.ruleId = rule.id;
			rule._executeCallback(reply, input);
		}
	}

	addRule(
		rule: Matchers,
		numRequestsAllowed?: number,
		intervalTime?: number,
		callback?: (reply: RateLimiterReply, input: Record<string, any>) => void,
	): string {
		const options: RuleOptions = {
			numRequestsAllowed: numRequestsAllowed || DEFAULT_REQUESTS_PER_INTERVAL,
			intervalTime: intervalTime || DEFAULT_INTERVAL_TIME_IN_MILLISECONDS,
			callback: callback && Meteor.bindEnvironment(callback),
		};

		const newRule = new Rule(options, rule);
		this.rules[newRule.id] = newRule;
		return newRule.id;
	}

	increment(input: Record<string, any>): void {
		// Only increment rule counters that match this input
		const matchedRules = this._findAllMatchingRules(input);
		matchedRules.forEach((rule) => this._incrementRule(rule, input));
	}

	incrementRules(rules: Rule[], input: Record<string, any>): void {
		rules.forEach((rule) => this._incrementRule(rule, input));
	}

	_incrementRule(rule: Rule, input: Record<string, any>): void {
		const ruleResult = rule.apply(input);

		if (ruleResult.timeSinceLastReset > rule.options.intervalTime) {
			// Reset all the counters since the rule has reset
			rule.resetCounter();
		}

		if (hasOwn.call(rule.counters, ruleResult.key)) {
			rule.counters[ruleResult.key]++;
		} else {
			rule.counters[ruleResult.key] = 1;
		}
	}

	_findAllMatchingRules(input: Record<string, any>): Rule[] {
		return Object.values(this.rules).filter((rule) => rule.match(input));
	}

	async _findAllMatchingRulesAsync(input: Record<string, any>): Promise<Rule[]> {
		const matches: Rule[] = [];
		for (const rule of Object.values(this.rules)) {
			if (await rule.matchAsync(input)) {
				matches.push(rule);
			}
		}
		return matches;
	}

	removeRule(id: string): boolean {
		if (this.rules[id]) {
			delete this.rules[id];
			return true;
		}
		return false;
	}
}

export { RateLimiter };
