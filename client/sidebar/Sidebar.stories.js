import React from 'react';

import Header from './header';
import RoomList from './RoomList';
// import Extended from './Item/Extended';
// import RoomAvatar from '../avatar/RoomAvatar';
import { UserContext } from '../contexts/UserContext';
import { SettingsContext } from '../contexts/SettingsContext';

export default {
	title: 'Sidebar',
	component: '',
};

// const viewModes = ['extended', 'medium', 'condensed'];
// const sortBy = ['activity', 'alphabetical'];

/*
	[] extended
		[] com avatar
		[] sem avatar
		[] unread
			[] sem badge
		[] badges
			[] normal
			[] mention grupo
			[] mention direta
		[] last message
			[] `You:`
			[] No messages yet
			[] Fulano:
			[] yesterday
			[] day month
	[] medium
		[] sem avatar
		[] com avatar
			[] sem avatar
			[] unread
				[] sem badge
			[] badges
				[] normal
				[] mention grupo
				[] mention direta
	[] condensed
		[] sem avatar
		[] com avatar
			[] sem avatar
			[] unread
				[] sem badge
			[] badges
				[] normal
				[] mention grupo
				[] mention direta

*/

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
	sidebarHideAvatar: false,
	sidebarGroupByType: true,
	sidebarShowFavorites: true,
	sidebarShowDiscussion: true,
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

const Sidebar = () => <>
	<SettingsContext.Provider value={settingContextValue} >
		<UserContext.Provider value={userContextValue}>
			<aside class='sidebar sidebar--main' role='navigation'>
				<Header />
				<div class='rooms-list sidebar--custom-colors' aria-label='Channels' role='region'>
					<RoomList />
				</div>
			</aside>
		</UserContext.Provider>
	</SettingsContext.Provider>
</>;

export const Default = () => <Sidebar />;
