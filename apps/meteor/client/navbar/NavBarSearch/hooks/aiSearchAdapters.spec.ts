import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';

import { getRoomLookupQuery } from './aiSearchAdapters';
import { createFakeSubscription } from '../../../../tests/mocks/data';

const channel = createFakeSubscription({ rid: 'rid-general', name: 'general', fname: 'General', t: 'c' });
const privateGroup = createFakeSubscription({ rid: 'rid-team', name: 'team', fname: 'Team', t: 'p' });
const directMessage = createFakeSubscription({ rid: 'rid-dm', name: 'alice', fname: 'Alice', t: 'd' });

const lookUp = (text: string) => [channel, privateGroup, directMessage].filter(createPredicateFromFilter(getRoomLookupQuery(text)));

describe('getRoomLookupQuery', () => {
	it('matches every room but direct messages for an empty lookup text', () => {
		expect(lookUp('')).toEqual([channel, privateGroup]);
	});

	it('matches rooms by name or display name and still leaves direct messages out', () => {
		expect(lookUp('gen')).toEqual([channel]);
		expect(lookUp('ali')).toEqual([]);
	});
});
