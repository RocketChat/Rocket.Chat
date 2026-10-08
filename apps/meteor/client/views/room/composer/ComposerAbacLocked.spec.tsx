import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { RoomToolboxContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import ComposerAbacLocked from './ComposerAbacLocked';
import { createFakeRoom } from '../../../../tests/mocks/data';

let currentRoom: IRoom;
const canManage = jest.fn(() => false);

jest.mock('../contexts/RoomContext', () => ({
	useRoom: () => currentRoom,
}));

jest.mock('../hooks/useCanManageRoomAbacAttributes', () => ({
	useCanManageRoomAbacAttributes: () => canManage(),
}));

const AppRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		ABAC_Room_locked_channel: 'Channel locked',
		ABAC_Room_locked_discussion: 'discussions stay locked',
		ABAC_Room_locked_public: 'make this channel private',
		ABAC_Room_locked_team: 'Team locked',
		ABAC_Manage_attributes: 'Manage attributes',
	})
	.build();

const renderFor = (room: IRoom) => {
	currentRoom = room;
	const openTab = jest.fn();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<RoomToolboxContext.Provider value={{ actions: [], openTab, closeTab: jest.fn() }}>{children}</RoomToolboxContext.Provider>
		</AppRoot>
	);

	render(<ComposerAbacLocked />, { wrapper });

	return { openTab };
};

describe('ComposerAbacLocked', () => {
	beforeEach(() => {
		canManage.mockReturnValue(false);
	});

	it('should tell a private channel it is locked', () => {
		renderFor(createFakeRoom({ t: 'p' }));

		expect(screen.getByText('Channel locked')).toBeInTheDocument();
	});

	it('should tell a private team it is locked', () => {
		renderFor(createFakeRoom({ t: 'p', teamMain: true }));

		expect(screen.getByText('Team locked')).toBeInTheDocument();
	});

	it('should not offer attributes on a private discussion, which no attribute set unlocks', () => {
		renderFor(createFakeRoom({ t: 'p', prid: 'parent-room' }));

		expect(screen.getByText('discussions stay locked')).toBeInTheDocument();
	});

	it('should not offer attributes on a public channel, which cannot hold them', () => {
		renderFor(createFakeRoom({ t: 'c' }));

		expect(screen.getByText('make this channel private')).toBeInTheDocument();
	});

	it('should not tell a public discussion to go private, which would not unlock it', () => {
		renderFor(createFakeRoom({ t: 'c', prid: 'parent-room' }));

		expect(screen.getByText('discussions stay locked')).toBeInTheDocument();
	});

	it('should not offer Manage attributes to a member who cannot manage them', () => {
		renderFor(createFakeRoom({ t: 'p' }));

		expect(screen.queryByRole('button', { name: 'Manage attributes' })).not.toBeInTheDocument();
	});

	it.each([
		['a channel', createFakeRoom({ t: 'p' })],
		['a team', createFakeRoom({ t: 'p', teamMain: true })],
	])('should open the attributes form of %s from Manage attributes', async (_name, room) => {
		canManage.mockReturnValue(true);
		const { openTab } = renderFor(room);

		await userEvent.click(screen.getByRole('button', { name: 'Manage attributes' }));
		await userEvent.click(screen.getByRole('button', { name: 'Manage attributes' }));

		expect(openTab).toHaveBeenNthCalledWith(1, 'abac-attributes', 'manage');
		expect(openTab).toHaveBeenNthCalledWith(2, 'abac-attributes', 'manage');
	});
});
