import type { ChatMessage, RoomItem } from './api';
import { letterAvatars } from './mockAvatars';

export const mockRooms: RoomItem[] = [
	{ rid: 'r1', t: 'c', name: 'general', title: 'general', unread: 3, sortKey: '5' },
	{ rid: 'r2', t: 'c', name: 'design-review', title: 'design-review', unread: 0, sortKey: '4' },
	{ rid: 'r3', t: 'p', name: 'launch-team', title: 'launch-team', unread: 12, sortKey: '3' },
	{ rid: 'r4', t: 'd', name: 'ada.lovelace', title: 'ada.lovelace', unread: 0, sortKey: '2' },
	{ rid: 'r5', t: 'c', name: 'a-channel-with-a-rather-long-name-that-must-truncate', title: 'a-channel-with-a-rather-long-name-that-must-truncate', unread: 120, sortKey: '1' },
];

// There is no server to serve /avatar in mock mode: a letter PNG per name (src/mockAvatars.ts), and two solid squares as plain uploads
const solids: Record<string, string> = {
	'design-review': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mN4EOVNFcQwatCoQaMGjRo0atCoQQNvEAAEs2tuqhHb7AAAAABJRU5ErkJggg==',
	'launch-team': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAH0lEQVR42mPw7n5AFcQwatCoQaMGjRo0atCoQQNvEAC/HdmupEWdSgAAAABJRU5ErkJggg==',
};

// Two names use the public default (SVG) avatars so the SVG path shows in mock mode
const publicDefaults: Record<string, string> = {
	general: 'https://open.rocket.chat/avatar/rocket.cat',
	'ada.lovelace': 'https://open.rocket.chat/avatar/ggazzo',
};

export const mockAvatar = (name: string) => publicDefaults[name] ?? solids[name] ?? letterAvatars[name[0]?.toUpperCase() ?? ''] ?? solids['design-review'];

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

// md values are the output of message-parser's parse() for msg
const user = { ada: { _id: 'u1', username: 'ada.lovelace', name: 'Ada Lovelace' }, grace: { _id: 'u2', username: 'grace.hopper', name: 'Grace Hopper' } };
const text = (value: string) => ({ type: 'PLAIN_TEXT', value }) as const;

// Newest first, as loadHistory returns it
export const mockMessages: ChatMessage[] = [
	{
		_id: 'm5',
		rid: 'r1',
		ts: at(2),
		_updatedAt: at(2),
		msg: 'Shipping the **build** now, _carefully_ with `yarn build`.',
		md: [
			{
				type: 'PARAGRAPH',
				value: [
					text('Shipping the '),
					{ type: 'BOLD', value: [text('build')] },
					text(' now, '),
					{ type: 'ITALIC', value: [text('carefully')] },
					text(' with '),
					{ type: 'INLINE_CODE', value: text('yarn build') },
					text('.'),
				],
			},
		],
		reactions: { ':tada:': { usernames: ['grace.hopper', 'alan.turing'] }, ':eyes:': { usernames: ['grace.hopper'] } },
		attachments: [{ title: 'release-notes.pdf', title_link: '/file-upload/abc123/release-notes.pdf', type: 'file' }],
		u: user.ada,
	},
	{
		_id: 'm4',
		rid: 'r1',
		ts: at(9),
		_updatedAt: at(8),
		editedAt: at(8),
		editedBy: { _id: 'u2', username: 'grace.hopper' },
		msg: 'See https://rocket.chat and ask @ada.lovelace in #general',
		md: [
			{
				type: 'PARAGRAPH',
				value: [
					text('See '),
					{ type: 'LINK', value: { src: text('https://rocket.chat'), label: [text('https://rocket.chat')] } },
					text(' and ask '),
					{ type: 'MENTION_USER', value: text('ada.lovelace') },
					text(' in '),
					{ type: 'MENTION_CHANNEL', value: text('general') },
				],
			},
		],
		mentions: [{ _id: 'u1', username: 'ada.lovelace', name: 'Ada Lovelace', type: 'user' }],
		channels: [{ _id: 'r1', name: 'general' }],
		u: user.grace,
	},
	{
		_id: 'm3',
		rid: 'r1',
		ts: at(15),
		_updatedAt: at(15),
		msg: '- one\n- two\n- three',
		md: [{ type: 'UNORDERED_LIST', value: [{ type: 'LIST_ITEM', value: [text('one')] }, { type: 'LIST_ITEM', value: [text('two')] }, { type: 'LIST_ITEM', value: [text('three')] }] }],
		u: { _id: 'u3', username: 'alan.turing' },
	},
	{
		_id: 'm2',
		rid: 'r1',
		ts: at(31),
		_updatedAt: at(31),
		msg: '> Can someone review the pull request?\nI can take it.',
		md: [
			{ type: 'QUOTE', value: [{ type: 'PARAGRAPH', value: [text('Can someone review the pull request?')] }] },
			{ type: 'PARAGRAPH', value: [text('I can take it.')] },
		],
		u: user.ada,
	},
	{ _id: 'm1', rid: 'r1', ts: at(60), _updatedAt: at(60), msg: 'Good morning everyone.', u: user.grace },
];
