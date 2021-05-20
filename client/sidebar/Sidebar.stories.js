import React from 'react';

import { SettingsContext } from '../contexts/SettingsContext';
import { UserContext } from '../contexts/UserContext';
import RoomList from './RoomList/index';
import Header from './header';

export default {
	title: 'Sidebar',
	component: '',
};

const subscriptions = [
	{
		_id: '3Bysd8GrmkWBdS9RT',
		open: true,
		alert: true,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		ts: '2020-10-01T17:01:51.476Z',
		rid: 'GENERAL',
		name: 'general',
		t: 'c',
		type: 'c',
		u: {
			_id: '5yLFEABCSoqR5vozz',
			username: 'yyy',
			name: 'yyy',
		},
		_updatedAt: '2020-10-19T16:04:45.472Z',
		ls: '2020-10-19T16:02:26.649Z',
		lr: '2020-10-01T17:38:00.321Z',
		tunread: [],
		usernames: [],
		lastMessage: {
			_id: '5ZpfZg5R25aRZjDWp',
			rid: 'GENERAL',
			msg: 'teste',
			ts: '2020-10-19T16:04:45.427Z',
			u: {
				_id: 'fmdXpuxjFivuqfAPu',
				username: 'gabriellsh',
				name: 'Gabriel Henriques',
			},
			_updatedAt: '2020-10-19T16:04:45.454Z',
			mentions: [],
			channels: [],
		},
		lm: '2020-10-19T16:04:45.427Z',
		lowerCaseName: 'general',
		lowerCaseFName: 'general',
	},
];

// const t = (text) => text;

const userPreferences = {
	sidebarViewMode: 'medium',
	sidebarDisplayAvatar: true,
	sidebarGroupByType: true,
	sidebarShowFavorites: true,
	sidebarShowUnread: true,
	sidebarSortby: 'activity',
};

const settings = {
	UI_Use_Real_Name: true,
};

const userId = 123;
const userContextValue = {
	userId,
	user: { _id: userId },
	queryPreference: (pref) => ({
		getCurrentValue: () => userPreferences[pref],
		subscribe: () => () => undefined,
	}),
	querySubscriptions: () => ({
		getCurrentValue: () => subscriptions,
		subscribe: () => () => undefined,
	}),
	querySubscription: () => ({
		getCurrentValue: () => undefined,
		subscribe: () => () => undefined,
	}),
};

const settingContextValue = {
	hasPrivateAccess: true,
	isLoading: false,
	querySetting: (setting) => ({
		getCurrentValue: () => settings[setting],
		subscribe: () => () => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: () => [],
		subscribe: () => () => undefined,
	}),
	dispatch: async () => undefined,
};

const Sidebar = () => (
	<>
		<SettingsContext.Provider value={settingContextValue}>
			<UserContext.Provider value={userContextValue}>
				<aside className='sidebar sidebar--main' role='navigation'>
					<Header />
					<div className='rooms-list sidebar--custom-colors' aria-label='Channels' role='region'>
						<RoomList />
					</div>
				</aside>
			</UserContext.Provider>
		</SettingsContext.Provider>
	</>
);

export const Default = () => <Sidebar />;
