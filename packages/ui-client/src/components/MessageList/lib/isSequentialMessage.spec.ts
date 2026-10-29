import { createFakeMessage } from '@rocket.chat/mock-providers';

import { isSequentialMessage } from './isSequentialMessage';

const options = { groupingPeriodSeconds: 300 };
const at = (iso: string) => new Date(iso);
const author = { _id: 'author', username: 'author' };
const other = { _id: 'other', username: 'other' };

describe('isSequentialMessage', () => {
	const previous = createFakeMessage({ u: author, ts: at('2024-01-15T10:00:00Z') });

	it('should not group the first message', () => {
		expect(isSequentialMessage(previous, undefined, options)).toBe(false);
	});

	it('should group messages of the same author within the grouping period', () => {
		const current = createFakeMessage({ u: author, ts: at('2024-01-15T10:04:59Z') });

		expect(isSequentialMessage(current, previous, options)).toBe(true);
	});

	it.each([
		['another author', { u: other }],
		['another alias', { u: author, alias: 'bot' }],
		['past the grouping period', { u: author, ts: at('2024-01-15T10:05:00Z') }],
		['a message that is not groupable', { u: author, groupable: false }],
		['a system message', { u: author, t: 'uj' as const }],
	])('should not group %s', (_, overrides) => {
		const current = createFakeMessage({ ts: at('2024-01-15T10:01:00Z'), ...overrides });

		expect(isSequentialMessage(current, previous, options)).toBe(false);
	});

	it('should not group across days, even within the grouping period', () => {
		const lateNight = createFakeMessage({ u: author, ts: new Date(2024, 0, 15, 23, 59) });
		const afterMidnight = createFakeMessage({ u: author, ts: new Date(2024, 0, 16, 0, 1) });

		expect(isSequentialMessage(afterMidnight, lateNight, options)).toBe(false);
	});

	describe('in a room, where replies show as thread previews', () => {
		it('should group a reply with the message it replies to, whoever wrote it', () => {
			const reply = createFakeMessage({ u: other, tmid: previous._id, ts: at('2024-01-15T11:00:00Z') });

			expect(isSequentialMessage(reply, previous, options)).toBe(true);
		});

		it('should group replies of the same thread', () => {
			const first = createFakeMessage({ u: author, tmid: 'thread' });
			const second = createFakeMessage({ u: other, tmid: 'thread' });

			expect(isSequentialMessage(second, first, options)).toBe(true);
		});

		it('should not group a message that follows a reply', () => {
			const reply = createFakeMessage({ u: author, tmid: 'thread', ts: at('2024-01-15T10:00:00Z') });
			const current = createFakeMessage({ u: author, ts: at('2024-01-15T10:01:00Z') });

			expect(isSequentialMessage(current, reply, options)).toBe(false);
		});
	});

	describe('in a thread, where every message is a reply', () => {
		const threadOptions = { ...options, groupsThreadReplies: false };

		it('should group replies by author', () => {
			const first = createFakeMessage({ u: author, tmid: 'thread', ts: at('2024-01-15T10:00:00Z') });
			const second = createFakeMessage({ u: author, tmid: 'thread', ts: at('2024-01-15T10:01:00Z') });
			const third = createFakeMessage({ u: other, tmid: 'thread', ts: at('2024-01-15T10:02:00Z') });

			expect(isSequentialMessage(second, first, threadOptions)).toBe(true);
			expect(isSequentialMessage(third, second, threadOptions)).toBe(false);
		});
	});
});
