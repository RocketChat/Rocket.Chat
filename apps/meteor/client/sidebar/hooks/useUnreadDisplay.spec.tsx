import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useUnreadDisplay } from './useUnreadDisplay';
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

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		mentions_counter_one: '{{count}} mention',
		mentions_counter_other: '{{count}} mentions',
		threads_counter_one: '{{count}} unread threaded message',
		threads_counter_other: '{{count}} unread threaded messages',
		group_mentions_counter_one: '{{count}} group mention',
		group_mentions_counter_other: '{{count}} group mentions',
		unread_messages_counter_one: '{{count}} unread message',
		unread_messages_counter_other: '{{count}} unread messages',
	})
	.build();

it('should return correct unread data for [Direct message unread]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(dmUnread), {
		wrapper,
	});
	expect(result.current.unreadVariant).toBe('secondary');
	expect(result.current.unreadTitle).toBe('3 unread messages');

	expect(result.current.unreadCount).toHaveProperty('mentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 0);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.current.unreadCount).toHaveProperty('total', 3);
});

it('should return correct unread data for [Direct message with thread unread]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(dmThread), {
		wrapper,
	});
	expect(result.current.unreadVariant).toBe('primary');
	expect(result.current.unreadTitle).toBe('1 unread threaded message, 3 unread messages');

	expect(result.current.unreadCount).toHaveProperty('mentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 1);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.current.unreadCount).toHaveProperty('total', 4);
});

it('should return correct unread data for [Channel with unread messages alert only]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(alert), {
		wrapper,
	});

	expect(result.current.highlightUnread).toBe(true);
	expect(result.current.showUnread).toBe(false);

	expect(result.current.unreadCount).toHaveProperty('mentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 0);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.current.unreadCount).toHaveProperty('total', 0);
});

it('should return correct unread data for [Mention and group mention]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(mentionAndGroupMention), {
		wrapper,
	});
	expect(result.current.unreadVariant).toBe('danger');
	expect(result.current.unreadTitle).toBe('1 mention, 1 group mention');

	expect(result.current.unreadCount).toHaveProperty('mentions', 1);
	expect(result.current.unreadCount).toHaveProperty('threads', 0);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 1);
	expect(result.current.unreadCount).toHaveProperty('total', 2);
});

it('should return correct unread data for [Group mention]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(groupMention), {
		wrapper,
	});
	expect(result.current.unreadVariant).toBe('warning');
	expect(result.current.unreadTitle).toBe('2 group mentions');

	expect(result.current.unreadCount).toHaveProperty('mentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 0);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 2);
	expect(result.current.unreadCount).toHaveProperty('total', 2);
});

it('should return correct unread data for [Thread unread]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(tunread), {
		wrapper,
	});
	expect(result.current.unreadVariant).toBe('primary');
	expect(result.current.unreadTitle).toBe('1 unread threaded message');

	expect(result.current.unreadCount).toHaveProperty('mentions', 0);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 1);
	expect(result.current.unreadCount).toHaveProperty('total', 1);
});

it('should return correct unread data for [Thread and thread user mention]', async () => {
	const { result } = renderHook(() => useUnreadDisplay(tunreadUser), {
		wrapper,
	});
	expect(result.current.unreadVariant).toBe('danger');
	expect(result.current.unreadTitle).toBe('1 mention, 1 unread threaded message');

	expect(result.current.unreadCount).toHaveProperty('mentions', 1);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 1);
	expect(result.current.unreadCount).toHaveProperty('total', 2);
});

it('should not highlight unread if hideUnreadStatus is enabled', async () => {
	const { result } = renderHook(() => useUnreadDisplay(hideUnreadStatus));

	expect(result.current.highlightUnread).toBe(false);
	expect(result.current.showUnread).toBe(true);
});

it('should not show unread if hideUnreadStatus and hideMentionStatus is enabled', async () => {
	const { result } = renderHook(() => useUnreadDisplay(hideUnreadAndMention));

	expect(result.current.highlightUnread).toBe(false);
	expect(result.current.showUnread).toBe(false);
});

it("should not show unread if there isn't any unread message", async () => {
	const { result } = renderHook(() => useUnreadDisplay(noUnread));

	expect(result.current.highlightUnread).toBe(false);
	expect(result.current.showUnread).toBe(false);

	expect(result.current.unreadCount).toHaveProperty('mentions', 0);
	expect(result.current.unreadCount).toHaveProperty('groupMentions', 0);
	expect(result.current.unreadCount).toHaveProperty('threads', 0);
	expect(result.current.unreadCount).toHaveProperty('total', 0);
});
