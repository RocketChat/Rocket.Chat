import type { ISetting } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { UserContext, SettingsContext } from '@rocket.chat/ui-contexts';
import type { Meta, StoryFn } from '@storybook/react';
import type { ObjectId } from 'mongodb';
import type { ContextType } from 'react';

import Sidebar from './SidebarRegion';

export default {
	title: 'Sidebar',
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

const subscriptions: SubscriptionWithRoom[] = [
	{
		_id: '3Bysd8GrmkWBdS9RT',
		open: true,
		alert: true,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		ts: new Date(),
		rid: 'GENERAL',
		name: 'general',
		t: 'c',
		u: {
			_id: '5yLFEABCSoqR5vozz',
			username: 'yyy',
			name: 'yyy',
		},
		_updatedAt: new Date(),
		ls: new Date(),
		lr: new Date(),
		tunread: [],
		lowerCaseName: 'general',
		lowerCaseFName: 'general',
		estimatedWaitingTimeQueue: 0,
		livechatData: undefined,
		priorityWeight: 3,
		responseBy: undefined,
		usersCount: 0,
		waitingResponse: undefined,
	},
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
};

export const SidebarStory: StoryFn<typeof Sidebar> = () => <Sidebar />;
SidebarStory.decorators = [
	(fn) => (
		<SettingsContext.Provider value={settingContextValue}>
			<UserContext.Provider value={userContextValue}>{fn()}</UserContext.Provider>
		</SettingsContext.Provider>
	),
];
