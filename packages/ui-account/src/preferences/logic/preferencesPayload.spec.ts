import { parseHighlights, toPreferencesPayload } from './preferencesPayload';

const dontAskAgainItems = [
	{ action: 'delete-message', label: 'Delete message' },
	{ action: 'leave-room', label: 'Leave room' },
];

describe('parseHighlights', () => {
	it('splits on commas and line breaks, trimming blanks', () => {
		expect(parseHighlights('foo, bar\n baz ,,\n')).toEqual(['foo', 'bar', 'baz']);
	});

	it('returns an empty list for an empty field', () => {
		expect(parseHighlights('')).toEqual([]);
	});
});

describe('toPreferencesPayload', () => {
	it('passes plain fields through', () => {
		expect(toPreferencesPayload({ useEmojis: false, sendOnEnter: 'desktop' }, dontAskAgainItems)).toEqual({
			useEmojis: false,
			sendOnEnter: 'desktop',
		});
	});

	it('sends cleared highlights as an empty list', () => {
		expect(toPreferencesPayload({ highlights: '' }, dontAskAgainItems)).toEqual({ highlights: [] });
	});

	it('keeps the full entries of the actions still selected', () => {
		expect(toPreferencesPayload({ dontAskAgainList: ['leave-room'] }, dontAskAgainItems)).toEqual({
			dontAskAgainList: [{ action: 'leave-room', label: 'Leave room' }],
		});
	});

	it('clears the list when nothing is selected', () => {
		expect(toPreferencesPayload({ dontAskAgainList: [] }, dontAskAgainItems)).toEqual({ dontAskAgainList: [] });
	});
});
