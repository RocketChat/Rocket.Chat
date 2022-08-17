import type { ISetting, ISubscription } from '@rocket.chat/core-typings';
import { UserContext, SettingsContext } from '@rocket.chat/ui-contexts';
import { Meta, Story } from '@storybook/react';
import type { ObjectId } from 'mongodb';
import React, { ContextType } from 'react';

import RoomList from './RoomList/index';
import Header from './header';

export default {
	title: 'Sidebar',
} as Meta;

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
	},
};

const settingContextValue: ContextType<typeof SettingsContext> = {
	hasPrivateAccess: true,
	isLoading: false,
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

const subscriptions: ISubscription[] = [
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
	loginWithPassword: () => Promise.resolve(undefined),
	logout: () => Promise.resolve(undefined),
	queryRoom: () => [() => () => undefined, () => undefined],
};

export const Sidebar: Story = () => (
	<aside className='sidebar sidebar--main' role='navigation'>
		<Header />
		<div className='rooms-list sidebar--custom-colors' aria-label='Channels' role='region'>
			<RoomList />
		</div>
	</aside>
);
Sidebar.decorators = [
	(fn) => (
		<SettingsContext.Provider value={settingContextValue}>
			<UserContext.Provider value={userContextValue}>{fn()}</UserContext.Provider>
		</SettingsContext.Provider>
	),
];
