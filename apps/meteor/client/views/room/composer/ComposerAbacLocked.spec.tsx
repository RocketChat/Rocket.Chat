import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ComposerAbacLocked from './ComposerAbacLocked';
import { createFakeRoom } from '../../../../tests/mocks/data';

let currentRoom: IRoom;

jest.mock('../contexts/RoomContext', () => ({
	useRoom: () => currentRoom,
}));

const appRoot = mockAppRoot().withTranslations('en', 'core', {
	ABAC_Room_locked_member: 'set this room attributes',
	ABAC_Room_locked_public: 'make this channel private',
});

const renderFor = (room: IRoom) => {
	currentRoom = room;
	render(<ComposerAbacLocked />, { wrapper: appRoot.build() });
};

describe('ComposerAbacLocked', () => {
	it('should tell a private channel to have its attributes set', () => {
		renderFor(createFakeRoom({ t: 'p' }));

		expect(screen.getByText('set this room attributes')).toBeInTheDocument();
	});

	it('should treat a private discussion as any other private room, which is what the predicate does here', () => {
		renderFor(createFakeRoom({ t: 'p', prid: 'parent-room' }));

		expect(screen.getByText('set this room attributes')).toBeInTheDocument();
	});

	it('should not offer attributes on a public channel, which cannot hold them', () => {
		renderFor(createFakeRoom({ t: 'c' }));

		expect(screen.getByText('make this channel private')).toBeInTheDocument();
	});

	it('should treat a public discussion as public, since attributes cannot unlock it either', () => {
		renderFor(createFakeRoom({ t: 'c', prid: 'parent-room' }));

		expect(screen.getByText('make this channel private')).toBeInTheDocument();
	});
});
