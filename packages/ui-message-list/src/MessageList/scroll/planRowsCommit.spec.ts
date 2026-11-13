import { createFakeMessage } from '@rocket.chat/mock-providers';

import { planRowsCommit } from './planRowsCommit';
import { buildMessageListRows } from '../lib/buildMessageListRows';

const keys = (value: string) => value.split('');

const conversation = Array.from({ length: 12 }, (_, index) =>
	createFakeMessage({ _id: `m${index}`, ts: new Date(2024, 0, 15, 10, index) }),
);

/** The keys the list gives the virtualizer for the messages from `start` on, with the rows around them. */
const rowKeys = (start: number, { end = conversation.length, hasHeader = true } = {}) =>
	buildMessageListRows(conversation.slice(start, end), {
		groupingPeriodSeconds: 300,
		hasOlderMessages: start > 0,
		hasNewerMessages: false,
		hasHeader,
	}).keys;

/** The keys the list gives the virtualizer for some of the messages, under the header or, while older ones remain, the older loader. */
const keysOf = (messages: typeof conversation, { hasOlderMessages = false } = {}) =>
	buildMessageListRows(messages, { groupingPeriodSeconds: 300, hasOlderMessages, hasNewerMessages: false, hasHeader: true }).keys;

describe('planRowsCommit', () => {
	it('should render rows added at the start in shift mode (R36)', () => {
		expect(planRowsCommit(keys('cde'), keys('abcde'))).toEqual({ change: 'prepend', renderedLength: 5, shift: true });
	});

	it('should render rows added at the end without shift mode (R15)', () => {
		expect(planRowsCommit(keys('cde'), keys('cdef'))).toEqual({ change: 'append', renderedLength: 4, shift: false });
	});

	it('should stage rows added at both ends: the start first, in shift mode (R38)', () => {
		const first = planRowsCommit(keys('cde'), keys('abcdefg'));
		expect(first).toEqual({ change: 'prepend', renderedLength: 5, shift: true });

		const second = planRowsCommit(keys('abcde'), keys('abcdefg'));
		expect(second).toEqual({ change: 'append', renderedLength: 7, shift: false });
	});

	it('should render other changes at once without shift mode (R39, R40)', () => {
		expect(planRowsCommit(keys('abc'), keys('xyz'))).toEqual({ change: 'replace', renderedLength: 3, shift: false });
		expect(planRowsCommit(keys('abcd'), keys('abxd'))).toEqual({ change: 'reorder', renderedLength: 4, shift: false });
	});

	it('should render a page of older messages, which lands under the older loader, in shift mode (R36)', () => {
		expect(planRowsCommit(rowKeys(8), rowKeys(4))).toEqual({ change: 'prepend', renderedLength: rowKeys(4).length, shift: true });
	});

	it('should render the last page of older messages, with the header taking the place of the loader, in shift mode (R36, R37)', () => {
		expect(planRowsCommit(rowKeys(4), rowKeys(0))).toEqual({ change: 'prepend', renderedLength: rowKeys(0).length, shift: true });
	});

	it('should render the header taking the place of the loader alone in shift mode (R37)', () => {
		const loader = buildMessageListRows(conversation, {
			groupingPeriodSeconds: 300,
			hasOlderMessages: true,
			hasNewerMessages: false,
			hasHeader: true,
		}).keys;

		expect(planRowsCommit(loader, rowKeys(0))).toEqual({ change: 'prepend', renderedLength: rowKeys(0).length, shift: true });
	});

	it('should stage a page of older messages that arrives with a message at the end: the page first, in shift mode (R38)', () => {
		const first = planRowsCommit(rowKeys(8, { end: 11 }), rowKeys(4));
		expect(first).toEqual({ change: 'prepend', renderedLength: rowKeys(4, { end: 11 }).length, shift: true });

		const second = planRowsCommit(rowKeys(4, { end: 11 }), rowKeys(4));
		expect(second).toEqual({ change: 'append', renderedLength: rowKeys(4).length, shift: false });
	});

	it('should render a message removed under the older loader in shift mode (R36)', () => {
		expect(planRowsCommit(rowKeys(4), rowKeys(5))).toEqual({ change: 'prepend', renderedLength: rowKeys(5).length, shift: true });
	});

	it('should render the first message under a header shown alone as an arrival at the end, not as another window (R15, R40)', () => {
		expect(planRowsCommit(keysOf([]), keysOf(conversation.slice(11)))).toEqual({ change: 'append', renderedLength: 2, shift: false });
	});

	it('should render the first messages under an older loader shown alone as a page of older messages, in shift mode (R36, R40)', () => {
		const loader = keysOf([], { hasOlderMessages: true });

		expect(planRowsCommit(loader, keysOf(conversation.slice(8), { hasOlderMessages: true }))).toEqual({
			change: 'prepend',
			renderedLength: 5,
			shift: true,
		});
		expect(planRowsCommit(loader, keysOf(conversation))).toEqual({ change: 'prepend', renderedLength: 13, shift: true });
	});

	it('should still render the first rows of a list that showed none as another window (R40)', () => {
		expect(planRowsCommit([], keysOf(conversation))).toEqual({ change: 'replace', renderedLength: 13, shift: false });
	});
});
