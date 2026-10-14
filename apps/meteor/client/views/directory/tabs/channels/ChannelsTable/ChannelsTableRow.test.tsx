import { after, before, describe, it, mock } from 'node:test';

import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';

import { enterModuleScope, leaveModuleScope } from '../../../../../../tests/mocks/moduleScope';

let ChannelsTableRow: (typeof import('./ChannelsTableRow'))['default'];

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
	before(() => {
		enterModuleScope();
		mock.module('../../../../../lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: { getRoomDirectives: () => ({ getAvatarPath: () => undefined }) },
			},
		});
		mock.module('../../../RoomTags', {
			exports: {
				default: {
					__esModule: true,
					default: () => null,
				},
			},
		});
		({ default: ChannelsTableRow } = require('./ChannelsTableRow'));
	});

	after(leaveModuleScope);
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
