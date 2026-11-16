import { getAuthorUsername } from './getAuthorUsername';

const on = { showUsername: true, showRealName: true };

describe('getAuthorUsername', () => {
	it('shows the username when everything applies and the name differs (message-variants R12)', () => {
		expect(getAuthorUsername({ name: 'Alex Smith', username: 'alex.smith' }, on)).toEqual({
			normalizedUsername: 'alex.smith',
			showUsername: true,
		});
	});

	it.each([
		['the viewer hid usernames', { name: 'Alex Smith', username: 'alex.smith' }, { ...on, showUsername: false }],
		['real names are off', { name: 'Alex Smith', username: 'alex.smith' }, { ...on, showRealName: false }],
		['there is no name', { name: undefined, username: 'alex.smith' }, on],
		['the name is empty', { name: '', username: 'alex.smith' }, on],
		['the name is the username', { name: 'alex.smith', username: 'alex.smith' }, on],
		['the name is the username with a leading @', { name: '@alex.smith', username: 'alex.smith' }, on],
		['the username has a leading @ and the name is the same', { name: 'alex.smith:matrix.org', username: '@alex.smith:matrix.org' }, on],
	])('leaves the username out when %s (message-variants R12)', (_title, author, options) => {
		expect(getAuthorUsername(author, options).showUsername).toBe(false);
	});

	it('strips the leading @ of a federated username (message-variants R12)', () => {
		expect(getAuthorUsername({ name: 'Alex', username: '@alex:matrix.org' }, on).normalizedUsername).toBe('alex:matrix.org');
	});
});
