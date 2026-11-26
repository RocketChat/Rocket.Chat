import type { ChatMessage, RoomItem } from './api';

export const mockRooms: RoomItem[] = [
	{ rid: 'r1', t: 'c', name: 'general', title: 'general', unread: 3, sortKey: '5' },
	{ rid: 'r2', t: 'c', name: 'design-review', title: 'design-review', unread: 0, sortKey: '4' },
	{ rid: 'r3', t: 'p', name: 'launch-team', title: 'launch-team', unread: 12, sortKey: '3' },
	{ rid: 'r4', t: 'd', name: 'ada.lovelace', title: 'ada.lovelace', unread: 0, sortKey: '2' },
	{ rid: 'r5', t: 'c', name: 'a-channel-with-a-rather-long-name-that-must-truncate', title: 'a-channel-with-a-rather-long-name-that-must-truncate', unread: 120, sortKey: '1' },
];

// There is no server to serve /avatar in mock mode: 24px solid squares as data URIs, one color per name
const placeholders = [
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mN4EOVNFcQwatCoQaMGjRo0atCoQQNvEAAEs2tuqhHb7AAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mPw7n5AFcQwatCoQaMGjRo0atCoQQNvEAC/HdmupEWdSgAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mPw3pBFFcQwatCoQaMGjRo0atCoQQNvEAABKyNuw68+1AAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mN4sFCLKohh1KBRg0YNGjVo1KBRgwbeIADyD8DuYcRYFAAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mPoijpBFcQwatCoQaMGjRo0atCoQQNvEACAacMuIF4C+wAAAABJRU5ErkJggg==',
];

export const mockAvatar = (name: string) => placeholders[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % placeholders.length];

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

// Newest first, as loadHistory returns it
export const mockMessages: ChatMessage[] = [
	{ _id: 'm5', rid: 'r1', ts: at(2), msg: 'Shipping the build now.', u: { _id: 'u1', username: 'ada.lovelace', name: 'Ada Lovelace' } },
	{
		_id: 'm4',
		rid: 'r1',
		ts: at(9),
		msg: 'A longer message to see how the body wraps over several lines on a narrow phone screen, with enough words to need at least three of them.',
		u: { _id: 'u2', username: 'grace.hopper', name: 'Grace Hopper' },
	},
	{ _id: 'm3', rid: 'r1', ts: at(15), msg: 'Looks good to me.', u: { _id: 'u3', username: 'alan.turing' } },
	{ _id: 'm2', rid: 'r1', ts: at(31), msg: 'Can someone review the pull request?', u: { _id: 'u1', username: 'ada.lovelace', name: 'Ada Lovelace' } },
	{ _id: 'm1', rid: 'r1', ts: at(60), msg: 'Good morning everyone.', u: { _id: 'u2', username: 'grace.hopper', name: 'Grace Hopper' } },
];
