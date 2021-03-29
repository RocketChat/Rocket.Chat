import React from 'react';

import BaseRemoveUsersModal from './BaseRemoveUsersModal';

export default {
	title: 'teams/TeamsMembers',
	component: BaseRemoveUsersModal,
};

const results = [
	{
		name: 'benchmark benchmark benchmark benchmark benchmark benchmark benchmark benchmark',
		icon: 'hashtag-lock',
		time: 'Jul 17, 2020 at 23:32:03',
	},
	{
		name: 'benchmark',
		icon: 'hashtag-lock',
		time: 'Jul 17, 2020 at 23:32:03',
		warning: (username) =>
			`${username} is last owner of this channel and will be managing it from outside the Team.`,
	},
	{
		name: 'benchmark',
		icon: 'hashtag-lock',
		time: 'Jul 17, 2020 at 23:32:03',
	},
	{
		name: 'benchmark',
		icon: 'hashtag-lock',
		time: 'Jul 17, 2020 at 23:32:03',
	},
	{
		name: 'benchmark',
		icon: 'hashtag-lock',
		time: 'Jul 17, 2020 at 23:32:03',
		warning: (username) =>
			`${username} is last owner of this channel and will be managing it from outside the Team.`,
	},
];

export const Default = () => <BaseRemoveUsersModal results={results} />;

export const Alert = () => <BaseRemoveUsersModal results={results} currentStep={2} />;
