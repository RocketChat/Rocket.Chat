import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import RoomMemberStatus from './RoomMemberStatus';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';

const user = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
	status: UserStatus.ONLINE,
});

const user2 = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
	statusText: 'Sample Status',
	status: UserStatus.ONLINE,
});

const user3 = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
	status: UserStatus.ONLINE,
});

const userWithExpiration = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
	statusText: 'In a meeting',
	statusExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
	status: UserStatus.BUSY,
});

describe('RoomMemberStatus', () => {
	it('should render the statusText of the DM partner', () => {
		const room = createFakeRoom({ t: 'd', uids: [user._id, user2._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomMemberStatus room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withUsers([user2])
					.build(),
			},
		);

		expect(screen.getByText('Sample Status')).toBeInTheDocument();
	});

	it('should expose the expiration text on the title attribute when the partner has one', () => {
		const room = createFakeRoom({ t: 'd', uids: [user._id, userWithExpiration._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomMemberStatus room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withUsers([userWithExpiration])
					.build(),
			},
		);

		const wrapper = screen.getByText('In a meeting').closest('[title]');
		expect(wrapper).toHaveAttribute('title');
		expect(wrapper?.getAttribute('title')).not.toBe('');
	});

	it('should not render statusText for multi-user DMs (3+ participants)', () => {
		const room = createFakeRoom({ t: 'd', uids: [user._id, user2._id, user3._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomMemberStatus room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withUsers([user2, user3])
					.build(),
			},
		);

		expect(screen.queryByText('Sample Status')).not.toBeInTheDocument();
	});

	it('should not render statusText for non-DM rooms', () => {
		const room = createFakeRoom({ t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomMemberStatus room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.build(),
			},
		);

		expect(screen.queryByText('Sample Status')).not.toBeInTheDocument();
	});
});
