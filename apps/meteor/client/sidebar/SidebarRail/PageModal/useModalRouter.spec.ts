import { matchPattern } from './useModalRouter';

describe('matchPattern', () => {
	const pattern = '/omnichannel-directory/:tab?/:context?/:id?';

	it('reads the params present in the path', () => {
		expect(matchPattern(pattern, '/omnichannel-directory/contacts/details/abc')).toEqual({
			tab: 'contacts',
			context: 'details',
			id: 'abc',
		});
	});

	it('leaves out the optional params missing from the path, and ignores the query', () => {
		expect(matchPattern(pattern, '/omnichannel-directory/chats?page=2')).toEqual({ tab: 'chats' });
	});

	it('does not match another route, or a path with more segments than the pattern', () => {
		expect(matchPattern('/directory/:tab?', '/channel/general')).toBeUndefined();
		expect(matchPattern('/directory/:tab?', '/directory/users/extra')).toBeUndefined();
	});
});
