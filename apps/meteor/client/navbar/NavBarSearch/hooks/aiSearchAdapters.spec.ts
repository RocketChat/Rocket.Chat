import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';

import { getRoomLookupQuery } from './aiSearchAdapters';
import { createFakeSubscription } from '../../../../tests/mocks/data';

const channel = createFakeSubscription({ rid: 'rid-general', name: 'general', fname: 'General', t: 'c' });
const privateGroup = createFakeSubscription({ rid: 'rid-team', name: 'team-alpha', fname: 'test squad', t: 'p' });
const directMessage = createFakeSubscription({ rid: 'rid-dm', name: 'alice', fname: 'Alice Cooper', t: 'd' });

const lookUp = (text: string) => [channel, privateGroup, directMessage].filter(createPredicateFromFilter(getRoomLookupQuery(text)));

describe('getRoomLookupQuery', () => {
	it('matches every room but direct messages for an empty lookup text', () => {
		expect(lookUp('')).toEqual([channel, privateGroup]);
	});

	it('matches rooms by their name', () => {
		expect(lookUp('alpha')).toEqual([privateGroup]);
	});

	it('matches rooms by their display name', () => {
		expect(lookUp('squad')).toEqual([privateGroup]);
	});

	it('leaves direct messages out even when their name or display name matches', () => {
		expect(lookUp('ali')).toEqual([]);
		expect(lookUp('cooper')).toEqual([]);
	});
});
