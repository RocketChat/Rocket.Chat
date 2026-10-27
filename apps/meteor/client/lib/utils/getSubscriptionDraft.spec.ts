import { getSubscriptionDraft } from './getSubscriptionDraft';

it('should return undefined when there is no draft', () => {
	expect(getSubscriptionDraft({})).toBeUndefined();
	expect(getSubscriptionDraft({ threadDrafts: {} })).toBeUndefined();
});

it('should return the main composer draft when present', () => {
	expect(getSubscriptionDraft({ draft: 'main draft' })).toBe('main draft');
});

it('should prefer the main composer draft over thread drafts', () => {
	expect(getSubscriptionDraft({ draft: 'main draft', threadDrafts: { t1: 'thread draft' } })).toBe('main draft');
});

it('should fall back to a thread draft when there is no main draft', () => {
	expect(getSubscriptionDraft({ threadDrafts: { t1: 'thread draft' } })).toBe('thread draft');
});

it('should return the first non-empty thread draft', () => {
	expect(getSubscriptionDraft({ threadDrafts: { t1: '', t2: 'second' } })).toBe('second');
});
