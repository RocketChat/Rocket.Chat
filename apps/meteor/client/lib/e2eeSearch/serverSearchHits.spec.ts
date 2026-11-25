import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchHit } from '@rocket.chat/desktop-api';

import { mergeSearchHits, toServerSearchHit } from './serverSearchHits';

const serverMessage = (fields: Partial<IMessage> = {}): IMessage =>
	({
		_id: 'm1',
		rid: 'r1',
		ts: new Date(1000),
		msg: 'plain text',
		u: { _id: 'u1', username: 'alice' },
		...fields,
	}) as IMessage;

const hit = (id: string, ts: number): E2EESearchHit => ({ id, rid: 'r1', uid: 'u1', username: 'alice', ts, snippet: id });

describe('toServerSearchHit', () => {
	it('gives no hit for a message outside the date window', () => {
		const window = { from: 500, to: 1500 };
		expect(toServerSearchHit(serverMessage({ ts: new Date(1000) }), 'plain', window)).toMatchObject({ id: 'm1' });
		expect(toServerSearchHit(serverMessage({ ts: new Date(499) }), 'plain', window)).toBeUndefined();
		expect(toServerSearchHit(serverMessage({ ts: new Date(1501) }), 'plain', window)).toBeUndefined();
	});

	it('escapes the text and highlights the searched words, not the filters', () => {
		expect(toServerSearchHit(serverMessage({ msg: 'Ship <b>it</b> on Friday' }), 'ship from:alice friday')).toEqual({
			id: 'm1',
			rid: 'r1',
			uid: 'u1',
			username: 'alice',
			ts: 1000,
			snippet: '<mark>Ship</mark> &lt;b&gt;it&lt;/b&gt; on <mark>Friday</mark>',
		});
	});

	it('keeps the thread of a reply', () => {
		expect(toServerSearchHit(serverMessage({ tmid: 't1' }), 'plain')).toMatchObject({ tmid: 't1' });
	});

	it('gives no hit for an encrypted message or a system message: the local index has the first, the second is no text', () => {
		expect(toServerSearchHit(serverMessage({ t: 'e2e' } as Partial<IMessage>), 'plain')).toBeUndefined();
		expect(toServerSearchHit(serverMessage({ t: 'uj' } as Partial<IMessage>), 'plain')).toBeUndefined();
	});

	it('shows the caption or the file name of a file message with no text', () => {
		const file = { _id: 'f1', name: 'report.pdf', type: 'application/pdf' };
		expect(
			toServerSearchHit(serverMessage({ msg: '', file, attachments: [{ description: 'q3 numbers' }] } as Partial<IMessage>), 'q3')?.snippet,
		).toBe('<mark>q3</mark> numbers');
		expect(toServerSearchHit(serverMessage({ msg: '', file } as Partial<IMessage>), 'report')?.snippet).toBe('<mark>report</mark>.pdf');
	});
});

describe('mergeSearchHits', () => {
	it('lists the hits of both sources newest first, each message once', () => {
		const merged = mergeSearchHits([
			{ hits: [hit('a', 30), hit('b', 10)], mayHaveMore: false },
			{ hits: [hit('c', 20), hit('a', 30)], mayHaveMore: false },
		]);

		expect(merged.map(({ id }) => id)).toEqual(['a', 'c', 'b']);
	});

	it('stops at the oldest message that a source with more pages read, so no hit of that source is skipped', () => {
		const merged = mergeSearchHits([
			{ hits: [hit('local-new', 50), hit('local-old', 5)], mayHaveMore: false },
			{ hits: [hit('server', 40)], mayHaveMore: true, oldestTs: 20 },
		]);

		expect(merged.map(({ id }) => id)).toEqual(['local-new', 'server']);
	});
});
