import type { TFunction } from 'i18next';

import { getUnreadDisplay } from './unreadDisplay';
import { createFakeSubscription } from '../../../tests/mocks/data';

const dmUnread = createFakeSubscription({
	t: 'd',
	unread: 3,
	userMentions: 0,
	groupMentions: 0,
	tunread: undefined,
	tunreadUser: undefined,
});

const dmThread = createFakeSubscription({
	t: 'd',
	unread: 3,
	userMentions: 0,
	groupMentions: 0,
	tunread: ['1'],
	tunreadUser: undefined,
});

const alert = createFakeSubscription({
	t: 'p',
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	tunread: undefined,
	tunreadUser: undefined,
	alert: true,
});

const mentionAndGroupMention = createFakeSubscription({
	t: 'p',
	unread: 2,
	userMentions: 1,
	groupMentions: 1,
	tunread: undefined,
	tunreadUser: undefined,
	alert: true,
});

const groupMention = createFakeSubscription({
	t: 'p',
	unread: 2,
	userMentions: 0,
	groupMentions: 2,
	tunread: undefined,
	tunreadUser: undefined,
	alert: true,
});

const tunread = createFakeSubscription({
	t: 'p',
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	tunread: ['1'],
	tunreadUser: undefined,
	alert: true,
});

const tunreadUser = createFakeSubscription({
	t: 'p',
	unread: 1,
	userMentions: 0,
	groupMentions: 0,
	tunread: ['1'],
	tunreadUser: ['1'],
	alert: true,
});

const hideUnreadStatus = createFakeSubscription({
	t: 'p',
	hideUnreadStatus: true,
});

const hideUnreadAndMention = createFakeSubscription({
	t: 'p',
	hideUnreadStatus: true,
	hideMentionStatus: true,
});

const noUnread = createFakeSubscription({
	t: 'p',
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	tunread: undefined,
	tunreadUser: undefined,
});

const catalog: Record<string, string> = {
	mentions_counter_one: '{{count}} mention',
	mentions_counter_other: '{{count}} mentions',
	threads_counter_one: '{{count}} unread threaded message',
	threads_counter_other: '{{count}} unread threaded messages',
	group_mentions_counter_one: '{{count}} group mention',
	group_mentions_counter_other: '{{count}} group mentions',
	unread_messages_counter_one: '{{count}} unread message',
	unread_messages_counter_other: '{{count}} unread messages',
};

// Stands in for the translator the caller hands over, so these rules are checked without a React tree around them.
const t = ((key: string, { count }: { count: number }) =>
	catalog[`${key}_${count === 1 ? 'one' : 'other'}`].replace('{{count}}', String(count))) as unknown as TFunction;

it('should return correct unread data for [Direct message unread]', () => {
	const result = getUnreadDisplay(dmUnread, t);
	expect(result.unreadVariant).toBe('secondary');
	expect(result.unreadTitle).toBe('3 unread messages');

	expect(result.unreadCount).toHaveProperty('mentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 0);
	expect(result.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.unreadCount).toHaveProperty('total', 3);
});

it('should return correct unread data for [Direct message with thread unread]', () => {
	const result = getUnreadDisplay(dmThread, t);
	expect(result.unreadVariant).toBe('primary');
	expect(result.unreadTitle).toBe('1 unread threaded message, 3 unread messages');

	expect(result.unreadCount).toHaveProperty('mentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 1);
	expect(result.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.unreadCount).toHaveProperty('total', 4);
});

it('should return correct unread data for [Channel with unread messages alert only]', () => {
	const result = getUnreadDisplay(alert, t);

	expect(result.highlightUnread).toBe(true);
	expect(result.showUnread).toBe(false);

	expect(result.unreadCount).toHaveProperty('mentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 0);
	expect(result.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.unreadCount).toHaveProperty('total', 0);
});

it('should return correct unread data for [Mention and group mention]', () => {
	const result = getUnreadDisplay(mentionAndGroupMention, t);
	expect(result.unreadVariant).toBe('danger');
	expect(result.unreadTitle).toBe('1 mention, 1 group mention');

	expect(result.unreadCount).toHaveProperty('mentions', 1);
	expect(result.unreadCount).toHaveProperty('threads', 0);
	expect(result.unreadCount).toHaveProperty('groupMentions', 1);
	expect(result.unreadCount).toHaveProperty('total', 2);
});

it('should return correct unread data for [Group mention]', () => {
	const result = getUnreadDisplay(groupMention, t);
	expect(result.unreadVariant).toBe('warning');
	expect(result.unreadTitle).toBe('2 group mentions');

	expect(result.unreadCount).toHaveProperty('mentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 0);
	expect(result.unreadCount).toHaveProperty('groupMentions', 2);
	expect(result.unreadCount).toHaveProperty('total', 2);
});

it('should return correct unread data for [Thread unread]', () => {
	const result = getUnreadDisplay(tunread, t);
	expect(result.unreadVariant).toBe('primary');
	expect(result.unreadTitle).toBe('1 unread threaded message');

	expect(result.unreadCount).toHaveProperty('mentions', 0);
	expect(result.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 1);
	expect(result.unreadCount).toHaveProperty('total', 1);
});

it('should return correct unread data for [Thread and thread user mention]', () => {
	const result = getUnreadDisplay(tunreadUser, t);
	expect(result.unreadVariant).toBe('danger');
	expect(result.unreadTitle).toBe('1 mention, 1 unread threaded message');

	expect(result.unreadCount).toHaveProperty('mentions', 1);
	expect(result.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 1);
	expect(result.unreadCount).toHaveProperty('total', 2);
});

it('should not highlight unread if hideUnreadStatus is enabled', () => {
	const result = getUnreadDisplay(hideUnreadStatus, t);

	expect(result.highlightUnread).toBe(false);
	expect(result.showUnread).toBe(true);
});

it('should not show unread if hideUnreadStatus and hideMentionStatus is enabled', () => {
	const result = getUnreadDisplay(hideUnreadAndMention, t);

	expect(result.highlightUnread).toBe(false);
	expect(result.showUnread).toBe(false);
});

it("should not show unread if there isn't any unread message", () => {
	const result = getUnreadDisplay(noUnread, t);

	expect(result.highlightUnread).toBe(false);
	expect(result.showUnread).toBe(false);

	expect(result.unreadCount).toHaveProperty('mentions', 0);
	expect(result.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.unreadCount).toHaveProperty('threads', 0);
	expect(result.unreadCount).toHaveProperty('total', 0);
});
