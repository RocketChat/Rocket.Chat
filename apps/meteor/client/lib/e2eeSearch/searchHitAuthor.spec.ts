import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchHit } from '@rocket.chat/desktop-api';

import { getSearchHitAuthor } from './searchHitAuthor';

const hit = (author: Partial<Pick<E2EESearchHit, 'uid' | 'username'>> = {}): E2EESearchHit => ({
	id: 'm1',
	rid: 'r1',
	ts: 1,
	snippet: 'text',
	uid: 'u1',
	username: 'alice',
	...author,
});

const loaded = (u: Partial<IMessage['u']>): Pick<IMessage, 'u'> => ({ u: { _id: 'u1', username: 'alice', ...u } });

describe('getSearchHitAuthor', () => {
	it('uses the author that the index stores with the hit', () => {
		expect(getSearchHitAuthor(hit())).toEqual({ username: 'alice' });
	});

	it('uses the author of the loaded message, with the real name, when the client has the message', () => {
		expect(getSearchHitAuthor(hit(), loaded({ name: 'Alice Doe' }))).toEqual({
			username: 'alice',
			name: 'Alice Doe',
		});
	});

	it('prefers the author of the loaded message to the author that the index stores with the hit', () => {
		expect(getSearchHitAuthor(hit(), loaded({ username: 'bob', name: 'Bob' }))).toEqual({ username: 'bob', name: 'Bob' });
	});

	it('falls back to the author that the index stores when the loaded message has no username', () => {
		expect(getSearchHitAuthor(hit(), { u: { _id: 'u1' } } as Pick<IMessage, 'u'>)).toEqual({ username: 'alice' });
	});
});
