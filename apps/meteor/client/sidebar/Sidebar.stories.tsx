import type { ISetting } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { UserContext, SettingsContext } from '@rocket.chat/ui-contexts';
import type { StoryObj, Meta } from '@storybook/react';
import type { ObjectId } from 'mongodb';
import type { ContextType } from 'react';

import Sidebar from './SidebarRegion';

export default {
	component: Sidebar,
} satisfies Meta<typeof Sidebar>;

const settings: Record<string, ISetting> = {
	UI_Use_Real_Name: {
		_id: 'UI_Use_Real_Name',
		blocked: false,
		createdAt: new Date(),
		env: true,
		i18nLabel: 'Use real name',
		packageValue: false,
		sorter: 1,
		ts: new Date(),
		type: 'boolean',
		value: true,
		public: true,
		_updatedAt: new Date(),
	},
	Discussion_enabled: {
		_id: 'Discussion_enabled',
		blocked: false,
		createdAt: new Date(),
		env: true,
		i18nLabel: 'Discussions',
		packageValue: true,
		sorter: 1,
		ts: new Date(),
		type: 'boolean',
		value: true,
		public: true,
		_updatedAt: new Date(),
	},
};

const settingContextValue: ContextType<typeof SettingsContext> = {
	hasPrivateAccess: true,
	querySetting: (_id) => [() => () => undefined, () => settings[_id]],
	querySettings: () => [() => () => undefined, () => []],
	dispatch: async () => undefined,
};

const userPreferences: Record<string, unknown> = {
	sidebarViewMode: 'medium',
	sidebarDisplayAvatar: true,
	sidebarGroupByType: true,
	sidebarShowFavorites: true,
	sidebarShowUnread: true,
	sidebarSortby: 'activity',
};

const createSubscription = ({
	_id,
	name,
	t = 'c',
	f = false,
	unread = 0,
	userMentions = 0,
	groupMentions = 0,
	prid,
	teamMain = false,
}: {
	_id: string;
	name: string;
	t?: SubscriptionWithRoom['t'];
	f?: boolean;
	unread?: number;
	userMentions?: number;
	groupMentions?: number;
	prid?: string;
	teamMain?: boolean;
}): SubscriptionWithRoom =>
	({
		_id,
		open: true,
		alert: unread > 0 || userMentions > 0 || groupMentions > 0,
		unread,
		userMentions,
		groupMentions,
		ts: new Date(),
		rid: _id.toUpperCase(),
		name,
		t,
		f,
		u: {
			_id: '5yLFEABCSoqR5vozz',
			username: 'john.doe',
			name: 'John Doe',
		},
		_updatedAt: new Date(),
		ls: new Date(),
		lr: new Date(),
		tunread: unread > 0 ? [`${_id}-thread`] : [],
		tunreadUser: userMentions > 0 ? [`${_id}-mention`] : [],
		tunreadGroup: groupMentions > 0 ? [`${_id}-group`] : [],
		lowerCaseName: name.toLowerCase(),
		lowerCaseFName: name.toLowerCase(),
		estimatedWaitingTimeQueue: 0,
		livechatData: undefined,
		priorityWeight: 3,
		prid,
		responseBy: undefined,
		teamMain,
		usersCount: 0,
		waitingResponse: undefined,
	}) as SubscriptionWithRoom;

const subscriptions: SubscriptionWithRoom[] = [
	...Array.from({ length: 32 }, (_, index) =>
		createSubscription({
			_id: `channel-${index}`,
			name: `channel-${index}`,
			f: index % 11 === 0,
			unread: index % 5 === 0 ? index + 1 : 0,
			userMentions: index % 9 === 0 ? 1 : 0,
		}),
	),
	...Array.from({ length: 8 }, (_, index) =>
		createSubscription({
			_id: `team-${index}`,
			name: `team-${index}`,
			teamMain: true,
			unread: index % 4 === 0 ? 2 : 0,
		}),
	),
	...Array.from({ length: 10 }, (_, index) =>
		createSubscription({
			_id: `direct-${index}`,
			name: `direct-${index}`,
			t: 'd',
			f: index === 0,
			unread: index % 3 === 0 ? 1 : 0,
		}),
	),
	...Array.from({ length: 6 }, (_, index) =>
		createSubscription({
			_id: `discussion-${index}`,
			name: `discussion-${index}`,
			prid: 'GENERAL',
			groupMentions: index === 0 ? 1 : 0,
		}),
	),
];

const userContextValue: ContextType<typeof UserContext> = {
	userId: 'john.doe',
	user: {
		_id: 'john.doe',
		username: 'john.doe',
		name: 'John Doe',
		createdAt: new Date(),
		active: true,
		_updatedAt: new Date(),
		roles: ['admin'],
		type: 'user',
	},
	queryPreference: <T,>(pref: string | ObjectId, defaultValue: T) => [
		() => () => undefined,
		() => (typeof pref === 'string' ? (userPreferences[pref] as T) : defaultValue),
	],
	querySubscriptions: () => [() => () => undefined, () => subscriptions],
	querySubscription: () => [() => () => undefined, () => undefined],
	queryRoom: () => [() => () => undefined, () => undefined],

	logout: () => Promise.resolve(),
	onLogout: () => () => undefined,
};

export const SidebarStory: StoryObj<typeof Sidebar> = {
	render: () => <Sidebar />,

	decorators: [
		(fn) => (
			<SettingsContext.Provider value={settingContextValue}>
				<UserContext.Provider value={userContextValue}>{fn()}</UserContext.Provider>
			</SettingsContext.Provider>
		),
	],
};
