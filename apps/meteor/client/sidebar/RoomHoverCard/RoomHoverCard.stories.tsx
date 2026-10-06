import type { IRoom, ISubscription, IUser, Serialized } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Box, Icon, SidebarItemIcon } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { AvatarUrlContext, UserContext, UserPresenceContext } from '@rocket.chat/ui-contexts';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import i18next from 'i18next';
import type { ContextType, ReactNode } from 'react';
import { useContext, useMemo } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { useRoomHoverCard } from './RoomHoverCardContext';
import RoomHoverCardProvider from './RoomHoverCardProvider';
import RoomHoverCardWithData from './RoomHoverCardWithData';
import en from '../../../../../packages/i18n/src/locales/en.i18n.json';
import {
	createFakeLicenseInfo,
	createFakeMessage,
	createFakeRoom,
	createFakeSubscription,
	createFakeUser,
} from '../../../tests/mocks/data';
import '../../lib/rooms/roomTypes';
import Medium from '../Item/Medium';

// Everything below is made up: no real people, rooms or messages.

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const me = createFakeUser({ _id: 'me', username: 'jamie.lee', name: 'Jamie Lee', roles: ['user'] });
const alex = createFakeUser({
	_id: 'alex',
	username: 'alex.rivera',
	name: 'Alex Rivera',
	roles: ['user', 'Product Design', 'Beta Testers'],
	bio: 'Product designer · design system and navigation.',
	utcOffset: -3,
	status: UserStatus.ONLINE,
});
const sam = createFakeUser({ _id: 'sam', username: 'sam.carter', name: 'Sam Carter', status: UserStatus.AWAY });
const priya = createFakeUser({ _id: 'priya', username: 'priya.nair', name: 'Priya Nair', status: UserStatus.ONLINE });
const users = [me, alex, sam, priya];

const rooms: IRoom[] = [
	createFakeRoom({
		_id: 'dm-alex',
		t: 'd',
		name: undefined,
		fname: undefined,
		uids: ['me', 'alex'],
		usernames: ['jamie.lee', 'alex.rivera'],
		usersCount: 2,
		teamId: undefined,
		lastMessage: createFakeMessage({
			rid: 'dm-alex',
			msg: 'Pushed the hover card tweaks. Can you take a look before the design review? It should take ~10 min.',
			u: { _id: 'alex', username: 'alex.rivera', name: 'Alex Rivera' },
			ts: minutesAgo(25),
		}),
	}),
	createFakeRoom({
		_id: 'design-system',
		t: 'c',
		name: 'design-system',
		fname: 'design-system',
		topic: 'Components, tokens and patterns for every surface. Proposals and questions welcome.',
		teamId: 'team-product',
		teamMain: false,
		usersCount: 128,
		lastMessage: createFakeMessage({
			rid: 'design-system',
			msg: 'New component release is out: sidebar items get a hover state and popovers gain placement options. Notes in the thread.',
			u: { _id: 'sam', username: 'sam.carter', name: 'Sam Carter' },
			ts: minutesAgo(70),
		}),
	}),
	createFakeRoom({
		_id: 'onboarding',
		t: 'p',
		name: 'onboarding-2027',
		fname: 'onboarding-2027',
		topic: undefined,
		teamId: undefined,
		usersCount: 6,
		lastMessage: undefined,
	}),
];

const threadParent = (_id: string, msg: string, author: IUser, lastReplyMinutesAgo: number) =>
	createFakeMessage({
		_id,
		rid: 'design-system',
		msg,
		u: { _id: author._id, username: author.username ?? '', name: author.name },
		tcount: 4,
		tlm: minutesAgo(lastReplyMinutesAgo),
		ts: minutesAgo(lastReplyMinutesAgo + 120),
	});

const designSystemThreads = [
	threadParent('th-tokens', 'Proposal: rename the surface tokens before the 2.0 release', sam, 12),
	threadParent('th-sbom', 'Who signs off on the icon set export for the docs site?', priya, 95),
	threadParent('th-a11y', 'Focus ring contrast fails on the dark sidebar', alex, 40),
	threadParent('th-motion', 'Reduced motion for popovers and menus', sam, 180),
	threadParent('th-figma', 'Library publish is failing again', priya, 260),
	threadParent('th-docs', 'Docs search ranks deprecated components first', alex, 400),
];

const subscriptions: ISubscription[] = [
	createFakeSubscription({
		rid: 'dm-alex',
		t: 'd',
		name: 'alex.rivera',
		fname: 'Alex Rivera',
		u: { _id: 'me', username: 'jamie.lee', name: 'Jamie Lee' },
		unread: 2,
		alert: true,
		userMentions: 0,
		groupMentions: 0,
		tunread: [],
		f: false,
		category: 'cat-design',
	}),
	createFakeSubscription({
		rid: 'design-system',
		t: 'c',
		name: 'design-system',
		fname: 'design-system',
		u: { _id: 'me', username: 'jamie.lee', name: 'Jamie Lee' },
		unread: 1,
		alert: true,
		userMentions: 0,
		groupMentions: 0,
		tunread: designSystemThreads.map(({ _id }) => _id),
		tunreadUser: ['th-sbom'],
		tunreadGroup: [],
		f: true,
		desktopNotifications: 'mentions',
	}),
	createFakeSubscription({
		rid: 'onboarding',
		t: 'p',
		name: 'onboarding-2027',
		fname: 'onboarding-2027',
		u: { _id: 'me', username: 'jamie.lee', name: 'Jamie Lee' },
		unread: 0,
		alert: false,
		userMentions: 0,
		groupMentions: 0,
		tunread: [],
		f: false,
	}),
];

const serialize = <T,>(value: T) => JSON.parse(JSON.stringify(value)) as Serialized<T>;

const matches = (doc: object, query: object) =>
	Object.entries(query).every(([key, value]) => (doc as Record<string, unknown>)[key] === value);

const AVATAR_COLORS = ['#1D74F5', '#F5455C', '#2DE0A5', '#F38C39', '#9F22C7'];

const initialsAvatar = (seed: string) => {
	const initials = seed
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('');
	const color = AVATAR_COLORS[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/><text x="100" y="100" dy=".35em" text-anchor="middle" font-family="Inter, sans-serif" font-size="88" font-weight="600" fill="#fff">${initials}</text></svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const avatarUrls: ContextType<typeof AvatarUrlContext> = {
	getUserPathAvatar: (...args: unknown[]) => {
		const [arg] = args as [string | { username?: string; userId?: string }];
		if (typeof arg === 'string') {
			return initialsAvatar(arg);
		}
		const user = users.find((user) => user.username === arg.username || user._id === arg.userId);
		return initialsAvatar(user?.name ?? arg.username ?? arg.userId ?? '?');
	},
	getRoomPathAvatar: ({ _id }: { _id: string }) => initialsAvatar(rooms.find((room) => room._id === _id)?.fname ?? _id),
};

// The source locale, with plurals flattened the way i18next reads them. Storybook's own instance reads the built
// package, which lacks strings added since its last build.
const translations = Object.fromEntries(
	Object.entries(en as Record<string, string | Record<string, string>>).flatMap(([key, value]) =>
		typeof value === 'string' ? [[key, value]] : Object.entries(value).map(([form, text]) => [`${key}_${form}`, text]),
	),
);

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
	lng: 'en',
	fallbackLng: 'en',
	ns: ['core'],
	defaultNS: 'core',
	resources: { en: { core: translations } },
	keySeparator: false,
	nsSeparator: false,
	interpolation: { escapeValue: false },
	initAsync: false,
});

// The app root serves one room and one subscription; the card needs several, the signed-in user, and per-user presence.
const FakeWorkspace = ({ children }: { children: ReactNode }) => {
	const outerUserContext = useContext(UserContext);

	const userContext = useMemo<ContextType<typeof UserContext>>(
		() => ({
			...outerUserContext,
			user: me,
			userId: me._id,
			queryRoom: (query) => [() => () => undefined, () => rooms.find((room) => matches(room, query as object))],
			querySubscription: (query) => [
				() => () => undefined,
				() => subscriptions.find((subscription) => matches(subscription, query as object)),
			],
		}),
		[outerUserContext],
	);

	const presence = useMemo<ContextType<typeof UserPresenceContext>>(
		() => ({
			queryUserData: (uid) => ({ subscribe: () => () => undefined, get: () => users.find((user) => user._id === uid) }),
		}),
		[],
	);

	return (
		<I18nextProvider i18n={i18n}>
			<UserContext.Provider value={userContext}>
				<UserPresenceContext.Provider value={presence}>
					<AvatarUrlContext.Provider value={avatarUrls}>{children}</AvatarUrlContext.Provider>
				</UserPresenceContext.Provider>
			</UserContext.Provider>
		</I18nextProvider>
	);
};

const workspace: Decorator = (Story) => (
	<FakeWorkspace>
		<Story />
	</FakeWorkspace>
);

const appRoot = mockAppRoot()
	.withSetting('UI_Use_Real_Name', true)
	.withSetting('Favorite_Rooms', true)
	.withSetting('VideoConf_Enable_DMs', true)
	.withPermission('call-management')
	.withUserPreference('sidebarCategories', [
		{ _id: 'cat-design', name: 'Design' },
		{ _id: 'cat-launch', name: 'Launch' },
	])
	.withEndpoint('GET', '/v1/licenses.info', () => ({ license: createFakeLicenseInfo({ hasValidLicense: true }) }))
	.withEndpoint('GET', '/v1/users.info', (params) => ({
		user: serialize(users.find((user) => 'userId' in params && user._id === params.userId) ?? alex),
	}))
	.withEndpoint('GET', '/v1/chat.getThreadsList', () => ({
		threads: serialize(designSystemThreads) as never,
		total: designSystemThreads.length,
		count: designSystemThreads.length,
		offset: 0,
	}))
	.withEndpoint('GET', '/v1/teams.info', () => ({ teamInfo: { _id: 'team-product', name: 'Product', roomId: 'product', type: 0 } }))
	.withEndpoint(
		'GET',
		'/v1/rooms.membersOrderedByRole',
		() =>
			({
				members: serialize([alex, sam, priya]),
				count: 3,
				offset: 0,
				total: 128,
			}) as never,
	)
	.buildStoryDecorator();

export default {
	title: 'Sidebar/RoomHoverCard',
	component: RoomHoverCardWithData,
	parameters: { layout: 'centered' },
	decorators: [workspace, appRoot],
	args: { onClose: () => undefined },
} satisfies Meta<typeof RoomHoverCardWithData>;

type Story = StoryObj<typeof RoomHoverCardWithData>;

export const DirectMessage: Story = { args: { rid: 'dm-alex' } };

export const ChannelInTeam: Story = { args: { rid: 'design-system' } };

export const RoomWithoutMessages: Story = { args: { rid: 'onboarding' } };

const ROOM_ICONS = { d: 'at', c: 'hash', p: 'hashtag-lock' } as const;

const HoverableRoom = ({ subscription }: { subscription: ISubscription }) => {
	const { openRoomHoverCard, closeRoomHoverCard } = useRoomHoverCard();
	const room = rooms.find(({ _id }) => _id === subscription.rid);

	return (
		<Medium
			href={`#${subscription.rid}`}
			title={subscription.fname ?? subscription.name}
			unread={subscription.alert}
			icon={<SidebarItemIcon icon={<Icon name={ROOM_ICONS[subscription.t as keyof typeof ROOM_ICONS]} size='x20' />} />}
			avatar={room && <RoomAvatar room={room} size='x20' />}
			onMouseEnter={(e) => openRoomHoverCard(e, subscription.rid)}
			onPointerDown={closeRoomHoverCard}
		/>
	);
};

/** Hover a room to open its card next to it, then move to the next room to hand the card over. */
export const InTheSidebar: StoryObj = {
	parameters: { layout: 'fullscreen' },
	render: () => (
		<RoomHoverCardProvider>
			<Box display='flex' height='100vh'>
				<Box
					width='x280'
					backgroundColor='surface-sidebar'
					paddingBlock={12}
					borderInlineEndWidth='default'
					borderColor='stroke-extra-light'
				>
					{subscriptions.map((subscription) => (
						<HoverableRoom key={subscription.rid} subscription={subscription} />
					))}
				</Box>
				<Box flexGrow={1} backgroundColor='surface-room' />
			</Box>
		</RoomHoverCardProvider>
	),
};
