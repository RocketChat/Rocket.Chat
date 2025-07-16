import { useUser, useUserSubscriptions, useRoomAvatarPath } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserAndRoomAutoCompleteMultiple from './UserAndRoomAutoCompleteMultiple';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

// Mock dependencies
jest.mock('@rocket.chat/ui-contexts', () => ({
	useUser: jest.fn(),
	useUserSubscriptions: jest.fn(),
	useRoomAvatarPath: jest.fn(),
}));
jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { readOnly: jest.fn() },
}));

const mockUser = { _id: 'user1', username: 'testuser' };

const mockRooms = [
	{
		rid: 'room1',
		fname: 'General',
		name: 'general',
		t: 'c',
		avatarETag: 'etag1',
	},
	{
		rid: 'room2',
		fname: 'Direct',
		name: 'direct',
		t: 'd',
		avatarETag: 'etag2',
		blocked: false,
		blocker: false,
	},
];

describe('UserAndRoomAutoCompleteMultiple', () => {
	beforeEach(() => {
		(useUser as jest.Mock).mockReturnValue(mockUser);
		(useUserSubscriptions as jest.Mock).mockReturnValue(mockRooms);
		(useRoomAvatarPath as jest.Mock).mockReturnValue((rid: string) => `/avatar/path/${rid}`);
		(roomCoordinator.readOnly as jest.Mock).mockReturnValue(false);
	});

	it('should render options based on user subscriptions', async () => {
		render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={jest.fn()} />);

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.getByText('General')).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText('Direct')).toBeInTheDocument();
		});
	});

	it('should filter out read-only rooms', async () => {
		(roomCoordinator.readOnly as jest.Mock).mockImplementation((rid) => rid === 'room1');
		render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={jest.fn()} />);

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.queryByText('General')).not.toBeInTheDocument();
		});
		await waitFor(() => {
			expect(screen.getByText('Direct')).toBeInTheDocument();
		});
	});

	it('should call onChange when selecting an option', async () => {
		const handleChange = jest.fn();
		render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={handleChange} />);

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.getByText('General')).toBeInTheDocument();
		});

		await userEvent.click(screen.getByText('General'));
		expect(handleChange).toHaveBeenCalled();
	});
});
