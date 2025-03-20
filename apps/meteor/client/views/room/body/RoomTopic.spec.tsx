import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import { RoomTopic } from './RoomTopic';
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

jest.mock('../../../hooks/usePresence', () => ({
	__esModule: true,
	usePresence: jest.fn((uid: string) => {
		if (uid === user._id) {
			return user;
		}
		if (uid === user2._id) {
			return user2;
		}
		if (uid === user3._id) {
			return user3;
		}
	}),
}));

describe('RoomTopic', () => {
	it('Should render Add Topic when no topic is present and user can edit room', () => {
		const room = createFakeRoom({ topic: '', t: 'c', u: { _id: user._id, username: user.username, name: user.name } });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id, u: room.u, roles: ['owner'] });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.getByText('Add_topic')).toBeInTheDocument();
	});

	it('Should not render Add Topic when no topic is present and user cannot edit room', () => {
		const room = createFakeRoom({ topic: '', t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});

	it('Should not render Add Topic when no statusText is present, user can edit room and room is a direct message room', () => {
		const room = createFakeRoom({ topic: '', t: 'd', uids: [user._id, user3._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withPermission('edit-room')
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});

	it('Should render topic when topic is present for rooms', () => {
		const room = createFakeRoom({ topic: 'Sample Topic', t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.getByText('Sample Topic')).toBeInTheDocument();
	});

	it('Should render statusText when statusText is present for direct message user and users length < 3', () => {
		const room = createFakeRoom({ topic: '', t: 'd', uids: [user._id, user2._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
		expect(screen.getByText('Sample Status')).toBeInTheDocument();
	});

	it('Should not render statusText when statusText is present for direct message user and users length >= 3', () => {
		const room = createFakeRoom({ topic: '', t: 'd', uids: [user._id, user2._id, user3._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
		expect(screen.queryByText('Sample Status')).not.toBeInTheDocument();
	});

	it('Should not render Add Topic for livechat rooms', () => {
		const room = createFakeRoom({ topic: '', t: 'l' });
		const subscription = createFakeSubscription({ t: 'l', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withPermission('edit-room')
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});

	it('Should not render Add Topic for voip rooms', () => {
		const room = createFakeRoom({ topic: '', t: 'v' });
		const subscription = createFakeSubscription({ t: 'v', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} user={user} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withPermission('edit-room')
					.build(),
				legacyRoot: true,
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});
});
