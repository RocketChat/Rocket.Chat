import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

// import type { default as _UserCardWithData } from '../../../../../../client/views/room/UserCard/UserCardWithData';

const date = new Date('2021-10-27T00:00:00.000Z');

const user: IUser = {
	_id: 'userId',
	emails: [
		{
			address: 'email@example.com',
			verified: false,
		},
	],
	type: 'user',
	roles: ['user', 'admin'],
	active: true,
	name: 'Full Name',
	statusConnection: 'offline',
	username: 'username',
	utcOffset: 5.5,
	createdAt: date,
	_updatedAt: date,
	status: UserStatus.OFFLINE,
};

const UserCardWithData = proxyquire.noCallThru().load('../../../../../../client/views/room/UserCard/UserCardWithData.tsx', {
	'../../../components/UserStatus': {
		ReactiveUserStatus: () => <span>user-status</span>,
	},
	'../../../components/UserCard': {
		UserCard: () => <div>content</div>,
		UserCardAction: () => <div>content</div>,
		UserCardRole: () => <div>content</div>,
		UserCardSkeleton: () => <div>UserCardSkeleton</div>,
	},
}).default;

describe('UserCardWithData', () => {
	it('should render user card', () => {
		render(<UserCardWithData username={user.username as string} onClose={() => null} onOpenUserInfo={() => null} rid='GENERAL' />);

		expect(screen.getByText(user.username as string)).to.exist;
	});
});
