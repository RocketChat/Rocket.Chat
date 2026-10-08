import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RoomHoverCardWithData from './RoomHoverCardWithData';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomName: (_type: string, room: { fname?: string; name?: string }) => room.fname || room.name,
		getRouteLink: () => '',
		openRouteLink: jest.fn(),
	},
}));

jest.mock('../../views/room/Header/icons/RoomGroupingButton', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('./RoomHoverCardThreadPreview', () => ({
	__esModule: true,
	default: () => null,
}));

const serialize = (room: IRoom) => JSON.parse(JSON.stringify(room)) as Serialized<IRoom>;

const subscribedTo = (room: IRoom) =>
	mockAppRoot()
		.withTranslations('en', 'core', { No_messages_yet: 'No messages yet' })
		.withSubscription(createFakeSubscription({ rid: room._id, t: room.t, name: room.name, fname: room.fname }));

it('asks the server for a room missing from the client cache, and shows its last message', async () => {
	const room = createFakeRoom({
		t: 'p',
		fname: 'RC AI Phase 6',
		lastMessage: createFakeMessage({ msg: 'Kickoff notes are in the thread' }),
	});

	render(<RoomHoverCardWithData rid={room._id} onClose={jest.fn()} />, {
		wrapper: subscribedTo(room)
			.withEndpoint('GET', '/v1/rooms.info', () => ({ room: serialize(room) }))
			.build(),
	});

	expect(await screen.findByText('RC AI Phase 6')).toBeInTheDocument();
	expect(screen.getByText('Kickoff notes are in the thread')).toBeInTheDocument();
});

it('says there are no messages yet for a room without any', async () => {
	const room = createFakeRoom({ t: 'c', fname: 'brand-new', lastMessage: undefined });

	render(<RoomHoverCardWithData rid={room._id} onClose={jest.fn()} />, {
		wrapper: subscribedTo(room).withRoom(room).build(),
	});

	expect(await screen.findByText('brand-new')).toBeInTheDocument();
	expect(screen.getByText('No messages yet')).toBeInTheDocument();
});
