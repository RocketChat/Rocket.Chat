import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ChannelsTableRow from './ChannelsTableRow';

jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { getRoomDirectives: () => ({ getAvatarPath: () => undefined }) },
}));

jest.mock('../../../RoomTags', () => ({
	__esModule: true,
	default: () => null,
}));

const appRoot = mockAppRoot().withJohnDoe().withSetting('Message_DateFormat', 'LL').build();

const renderRow = (room: Serialized<IRoom>) =>
	render(
		<table>
			<tbody>
				<ChannelsTableRow room={room} onClick={() => () => undefined} mediaQuery />
			</tbody>
		</table>,
		{ wrapper: appRoot },
	);

const createRoom = (overrides: Partial<Serialized<IRoom>> = {}): Serialized<IRoom> =>
	({
		_id: 'roomId',
		t: 'c',
		name: 'general',
		usersCount: 3,
		ts: '2026-01-05T10:00:00.000Z',
		belongsTo: 'my-team',
		...overrides,
	}) as Serialized<IRoom>;

describe('ChannelsTableRow', () => {
	it('should render the last message date', () => {
		renderRow(createRoom({ lastMessage: { _id: 'msgId', ts: '2026-04-24T20:30:45.000Z' } as unknown as Serialized<IRoom>['lastMessage'] }));

		expect(screen.getByText('April 24th, 2026')).toBeInTheDocument();
	});

	it('should keep every column in place when the stored last message has no timestamp', () => {
		renderRow(
			createRoom({ lastMessage: { reactions: { ':+1:': { usernames: ['john.doe'] } } } as unknown as Serialized<IRoom>['lastMessage'] }),
		);

		const cells = screen.getAllByRole('cell');
		expect(cells).toHaveLength(5);
		expect(cells[3]).toHaveTextContent('');
		expect(cells[4]).toHaveTextContent('my-team');
	});
});
