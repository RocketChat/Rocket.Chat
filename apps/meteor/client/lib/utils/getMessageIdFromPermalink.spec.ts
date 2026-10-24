import { getMessageIdFromPermalink } from './getMessageIdFromPermalink';

describe('getMessageIdFromPermalink', () => {
	it('returns the msg query parameter from an absolute permalink', () => {
		expect(getMessageIdFromPermalink('https://open.rocket.chat/channel/general?msg=abc123')).toBe('abc123');
	});

	it('returns the msg query parameter when other parameters are present', () => {
		expect(getMessageIdFromPermalink('https://open.rocket.chat/group/team?tab=thread&msg=xyz789&foo=bar')).toBe('xyz789');
	});

	it('returns the msg query parameter from a relative permalink', () => {
		expect(getMessageIdFromPermalink('/direct/abc?msg=def456')).toBe('def456');
	});

	it('returns undefined when there is no msg query parameter', () => {
		expect(getMessageIdFromPermalink('https://open.rocket.chat/channel/general')).toBeUndefined();
		expect(getMessageIdFromPermalink('https://open.rocket.chat/channel/general?msg=')).toBeUndefined();
	});

	it('returns undefined for empty or unparsable input', () => {
		expect(getMessageIdFromPermalink(undefined)).toBeUndefined();
		expect(getMessageIdFromPermalink('')).toBeUndefined();
		expect(getMessageIdFromPermalink('http://[invalid')).toBeUndefined();
	});
});
