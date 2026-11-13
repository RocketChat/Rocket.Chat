import { describe, it } from 'node:test';

import { parse } from '@rocket.chat/message-parser';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { formatMentionList } = proxyquire.noCallThru().load<typeof import('./formatMentionList')>('./formatMentionList', {
	'../../i18n': { i18n: { language: 'en' } },
});

const parseMentionedUsernames = (text: string): string[] => {
	const usernames: string[] = [];
	const walk = (node: unknown): void => {
		if (Array.isArray(node)) {
			node.forEach(walk);
			return;
		}
		if (typeof node !== 'object' || node === null) {
			return;
		}
		if ('type' in node && node.type === 'MENTION_USER' && 'value' in node) {
			usernames.push((node.value as { value: string }).value);
		}
		Object.values(node).forEach(walk);
	};
	walk(parse(text));
	return usernames;
};

const usernames = ['alice', 'bob', 'carol'];

describe('formatMentionList', () => {
	it('joins the last name with the conjunction of the language', () => {
		expect(formatMentionList(usernames, 'en')).to.equal('@alice, @bob, and @carol');
		expect(formatMentionList(usernames, 'pt-BR')).to.equal('@alice, @bob e @carol');
	});

	it('returns a single mention unchanged', () => {
		expect(formatMentionList(['alice'], 'zh')).to.equal('@alice');
	});

	for (const lng of ['en', 'de', 'pt-BR', 'zh', 'zh-TW', 'ja', 'ar', 'he', 'fa', 'ko']) {
		it(`keeps every name a mention in ${lng}`, () => {
			expect(parseMentionedUsernames(`You mentioned ${formatMentionList(usernames, lng)}, but`)).to.deep.equal(usernames);
		});
	}

	it('falls back to English for an invalid language tag', () => {
		expect(formatMentionList(usernames, 'not a locale')).to.equal('@alice, @bob, and @carol');
	});
});
