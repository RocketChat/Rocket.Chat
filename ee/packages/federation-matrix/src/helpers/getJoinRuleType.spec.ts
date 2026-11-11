import type { PduForType } from '@rocket.chat/federation-sdk';

import { getJoinRuleType } from './getJoinRuleType';

const joinRulesState = (content: Record<string, unknown>) => [{ type: 'm.room.join_rules', content }] as PduForType<'m.room.join_rules'>[];

describe('getJoinRuleType', () => {
	it('should return private when there is no join rules state', () => {
		expect(getJoinRuleType([])).toBe('p');
	});

	it('should return private for the invite join rule', () => {
		expect(getJoinRuleType(joinRulesState({ join_rule: 'invite' }))).toBe('p');
	});

	it('should return public for the public join rule', () => {
		expect(getJoinRuleType(joinRulesState({ join_rule: 'public' }))).toBe('c');
	});

	it('should return private when the join rules state has no join_rule', () => {
		expect(getJoinRuleType(joinRulesState({}))).toBe('p');
	});

	it('should throw when the join_rule is empty', () => {
		expect(() => getJoinRuleType(joinRulesState({ join_rule: '' }))).toThrow('Unknown join rule type: ');
	});

	it('should throw for an unknown join rule', () => {
		expect(() => getJoinRuleType(joinRulesState({ join_rule: 'foo' }))).toThrow('Unknown join rule type: foo');
	});
});
