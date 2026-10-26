import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchHit } from '@rocket.chat/desktop-api';

import { getSearchHitAuthor } from './searchHitAuthor';

const hit = (author: Partial<Pick<E2EESearchHit, 'uid' | 'username'>> = {}): E2EESearchHit => ({
	id: 'm1',
	rid: 'r1',
	ts: 1,
	snippet: 'text',
	...author,
});

const loaded = (u: Partial<IMessage['u']>): Pick<IMessage, 'u'> => ({ u: { _id: 'u1', username: 'alice', ...u } });

describe('getSearchHitAuthor', () => {
	it('uses the author that the index stores with the hit', () => {
		expect(getSearchHitAuthor(hit({ uid: 'u1', username: 'alice' }))).toEqual({ username: 'alice' });
	});

	it('uses the author of the loaded message, with the real name, when the client has the message', () => {
		expect(getSearchHitAuthor(hit({ uid: 'u1', username: 'alice' }), loaded({ name: 'Alice Doe' }))).toEqual({
			username: 'alice',
			name: 'Alice Doe',
		});
	});

	it('finds the author of a hit from an older desktop app in the loaded message', () => {
		expect(getSearchHitAuthor(hit(), loaded({ username: 'bob', name: 'Bob' }))).toEqual({ username: 'bob', name: 'Bob' });
	});

	it('has no author for a hit from an older desktop app when the client does not have the message', () => {
		expect(getSearchHitAuthor(hit())).toBeUndefined();
	});

	it('ignores an empty or malformed author from the bridge', () => {
		expect(getSearchHitAuthor(hit({ uid: 'u1', username: '' }))).toBeUndefined();
		expect(getSearchHitAuthor({ ...hit(), username: 42 } as unknown as E2EESearchHit)).toBeUndefined();
		expect(getSearchHitAuthor(hit(), { u: { _id: 'u1' } } as Pick<IMessage, 'u'>)).toBeUndefined();
	});
});
