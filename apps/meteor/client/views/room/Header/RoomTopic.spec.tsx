import { UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import { RoomCoordinator } from '../../../../lib/rooms/coordinator';
import { getPrivateRoomType } from '../../../../lib/rooms/roomTypes/private';
import { getPublicRoomType } from '../../../../lib/rooms/roomTypes/public';
import { Context, Page } from '../../../router/page';
import RoomTopic from './RoomTopic';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';

let mockRootPrefix = '';

jest.mock('../../../lib/absoluteUrl', () => ({
	_relativeToSiteRootUrl: (path: string) => `${mockRootPrefix}${path}`,
}));

class TestRoomCoordinator extends RoomCoordinator {
	constructor() {
		super();
		this.addRoomType(getPublicRoomType(this), {} as never);
		this.addRoomType(getPrivateRoomType(this), {} as never);
	}
}

const coordinator = new TestRoomCoordinator();

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
		mockRootPrefix = '';
		window.history.replaceState({}, '', '/');
	});

	it.each([
		{ type: 'c', team: false, base: '/channel/engineering' },
		{ type: 'p', team: false, base: '/group/engineering' },
		{ type: 'c', team: true, base: '/channel/engineering' },
		{ type: 'p', team: true, base: '/group/engineering' },
	] as const)('builds a canonical settings link for $type rooms (team: $team)', ({ type, team, base }) => {
		const room = createFakeRoom({ topic: '', name: 'engineering', t: type, ...(team && { teamMain: true, teamId: 'team-id' }) });
		const subscription = createFakeSubscription({ t: type, rid: room._id, u: room.u, roles: ['owner'] });
		const router = {
			getLocationPathname: jest.fn(() => `${base}/thread/message-id`),
			getRoomRoute: jest.fn((roomType: string, routeData: { name?: string }) => ({
				path: coordinator.getRouteLink(roomType, routeData) || '/',
			})),
		};

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withRouter(router)
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
			},
		);

		const suffix = team ? 'team-info' : 'channel-settings';
		expect(screen.getByText('Add_topic')).toHaveAttribute('href', `${base}/${suffix}`);
		expect(router.getRoomRoute).toHaveBeenCalledWith(type, { name: 'engineering' });
	});

	it.each([
		{ panel: 'plain', path: '/channel/engineering' },
		{ panel: 'thread', path: '/channel/engineering/thread/message-id' },
		{ panel: 'search', path: '/channel/engineering/rocket-search' },
	])('ignores the current $panel panel and handles root URL prefixes', ({ path }) => {
		mockRootPrefix = '/subdir';
		const room = createFakeRoom({ topic: '', name: 'engineering', t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id, u: room.u, roles: ['owner'] });

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withRouter({
						getLocationPathname: () => path,
						getRoomRoute: (type, routeData) => ({ path: coordinator.getRouteLink(type, routeData) || '/' }),
					})
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
			},
		);

		expect(screen.getByText('Add_topic')).toHaveAttribute('href', '/subdir/channel/engineering/channel-settings');
	});

	// A custom UTF8_Channel_Names_Validation regex can permit these canonical room names.
	it.each(['room#one', 'room+one', 'room/name', '100%', 'café'])('keeps valid configurable room name %s intact through real route matching', (name) => {
		const room = createFakeRoom({ topic: '', name, t: 'c' });
		const subscription = createFakeSubscription({ t: 'c', rid: room._id, u: room.u, roles: ['owner'] });
		const router = {
			getRoomRoute: jest.fn((roomType: string, routeData: { name?: string }) => ({
				path: coordinator.getRouteLink(roomType, routeData) || '/',
			})),
		};

		render(
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				<RoomTopic room={room} />
			</FakeRoomProvider>,
			{
				wrapper: mockAppRoot()
					.withRouter(router)
					.withSubscriptions([{ ...subscription, ...room }] as unknown as SubscriptionWithRoom[])
					.withPermission('edit-room')
					.withUser(user)
					.build(),
			},
		);

		const { path } = router.getRoomRoute.mock.results[0].value;
		expect(screen.getByText('Add_topic')).toHaveAttribute('href', `${path}/channel-settings`);
		const page = new Page();
		let resolvedName = '';
		page.registerRoute('/channel/:name/:tab?/:context?', (context: Context) => {
			resolvedName = context.params.name;
		});
		page.replace(`${path}/channel-settings`, { dispatch: true });

		expect(resolvedName).toBe(name);
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
