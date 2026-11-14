import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import RoomTopic from './RoomTopic';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';
import * as meteorRuntimeConfig from '../../../lib/meteorRuntimeConfig';

jest.mock('../../../lib/meteorRuntimeConfig', () => ({
	...jest.requireActual('../../../lib/meteorRuntimeConfig'),
	getRootUrlPathPrefix: jest.fn(() => ''),
}));

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

describe('RoomTopic', () => {
	afterEach(() => {
		jest.mocked(meteorRuntimeConfig.getRootUrlPathPrefix).mockReturnValue('');
	});

	it('should render Add Topic when no topic is present and user can edit room', () => {
		const room = createFakeRoom({ topic: '', t: 'c', u: { _id: user._id, username: user.username, name: user.name } });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id, u: room.u, roles: ['owner'] });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
			},
		);

		expect(screen.getByText('Add_topic')).toBeInTheDocument();
	});

	describe.each([
		{ label: 'public channel', t: 'c', teamMain: false, prefix: 'channel', tab: 'channel-settings' },
		{ label: 'private channel', t: 'p', teamMain: false, prefix: 'group', tab: 'channel-settings' },
		{ label: 'public team', t: 'c', teamMain: true, prefix: 'channel', tab: 'team-info' },
		{ label: 'private team', t: 'p', teamMain: true, prefix: 'group', tab: 'team-info' },
	] as const)('$label settings link', ({ t, teamMain, prefix, tab }) => {
		it.each([
			{ panel: '', sitePrefix: '', name: 'test-room', encodedName: 'test-room' },
			{ panel: '/thread/message-id', sitePrefix: '', name: 'test-room', encodedName: 'test-room' },
			{ panel: '/rocket-search', sitePrefix: '', name: 'test-room', encodedName: 'test-room' },
			{ panel: '/thread/message-id', sitePrefix: '/subdir', name: 'test-room', encodedName: 'test-room' },
			{ panel: '/thread/message-id', sitePrefix: '', name: 'room#one', encodedName: 'room%23one' },
			{ panel: '/thread/message-id', sitePrefix: '/subdir', name: 'room#one', encodedName: 'room%23one' },
		])('builds the settings link for "$name" from "$sitePrefix$panel"', ({ panel, sitePrefix, name, encodedName }) => {
			jest.mocked(meteorRuntimeConfig.getRootUrlPathPrefix).mockReturnValue(sitePrefix);
			const room = createFakeRoom({ name, topic: '', t, teamMain, u: user });
			const subscription = createFakeSubscription({ t, rid: room._id, u: room.u, roles: ['owner'] });
			const href = `${sitePrefix}/${prefix}/${encodedName}/${tab}`;
			const getRoomRoute = jest.fn().mockImplementation((_type, { name }) => ({ path: `/${prefix}/${name}` }));

			render(
				<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
					<RoomTopic room={room} />
				</FakeRoomProvider>,
				{
					wrapper: mockAppRoot()
						.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
						.withPermission('edit-room')
						.withUser(user)
						.withRouter({
							getLocationPathname: jest.fn().mockReturnValue(`${sitePrefix}/${prefix}/${encodedName}${panel}`),
							getRoomRoute,
						})
						.build(),
				},
			);

			expect(screen.getByRole('link', { name: 'Add_topic' })).toHaveAttribute('href', href);
			expect(getRoomRoute).toHaveBeenCalledWith(t, { name: encodedName });
		});
	});

	it('should not render Add Topic when no topic is present and user cannot edit room', () => {
		const room = createFakeRoom({ topic: '', t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.build(),
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});

	it('should not render Add Topic when no statusText is present, user can edit room and room is a direct message room', () => {
		const room = createFakeRoom({ topic: '', t: 'd', uids: [user._id, user3._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withUsers([user3])
					.withPermission('edit-room')
					.build(),
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});

	it('should render topic when topic is present for rooms', () => {
		const room = createFakeRoom({ topic: 'Sample Topic', t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.build(),
			},
		);

		expect(screen.getByText('Sample Topic')).toBeInTheDocument();
	});

	it('should not render the DM partner statusText (handled by RoomMemberStatus)', () => {
		const room = createFakeRoom({ topic: '', t: 'd', uids: [user._id, user2._id] });
		const subscription = createFakeSubscription({ t: 'd', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.withUsers([user2])
					.build(),
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
		expect(screen.queryByText('Sample Status')).not.toBeInTheDocument();
	});

	it('should not render Add Topic for livechat rooms', () => {
		const room = createFakeRoom({ topic: '', t: 'l' });
		const subscription = createFakeSubscription({ t: 'l', rid: room._id });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withUser(user)
					.withPermission('edit-room')
					.build(),
			},
		);

		expect(screen.queryByText('Add_topic')).not.toBeInTheDocument();
	});
});
