import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, fireEvent } from '@testing-library/react';

import MessageToolbar from './MessageToolbar';

// Mock the dependencies
jest.mock('../useDeleteMessageAction', () => ({
	useDeleteMessageAction: jest.fn(() => ({
		id: 'delete-message',
		icon: 'trash',
		label: 'Delete',
		action: jest.fn(),
	})),
}));

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		isLivechatRoom: jest.fn(() => false),
	},
}));

jest.mock('../../../views/room/contexts/ChatContext', () => ({
	useChat: jest.fn(() => ({
		data: {
			canDeleteMessage: jest.fn(() => true),
		},
		flows: {
			requestMessageDeletion: jest.fn(),
		},
	})),
}));

const mockMessage = {
	_id: 'message1',
	u: { _id: 'user1', username: 'testuser' },
	msg: 'Test message',
	ts: new Date(),
};

const mockRoom = {
	_id: 'room1',
	t: 'c',
	name: 'general',
};

const mockSubscription = {
	_id: 'sub1',
	rid: 'room1',
	uid: 'user1',
};

describe('MessageToolbar with Shift-key power user feature', () => {
	const renderToolbar = () => {
		return render(
			<MessageToolbar
				message={mockMessage as any}
				room={mockRoom as any}
				subscription={mockSubscription as any}
				onChangeMenuVisibility={() => {}}
			/>,
			{
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', {
						Message_actions: 'Message actions',
						Delete: 'Delete',
					})
					.build(),
			}
		);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should not show delete button initially', () => {
		renderToolbar();
		
		expect(screen.queryByTitle(/Delete/)).not.toBeInTheDocument();
	});

	it('should show delete button when shift is pressed', async () => {
		renderToolbar();
		
		// Simulate shift key press
		fireEvent.keyDown(document, { key: 'Shift' });
		
		expect(screen.getByTitle('Delete')).toBeInTheDocument();
	});

	it('should hide delete button when shift is released', async () => {
		renderToolbar();
		
		// Press shift
		fireEvent.keyDown(document, { key: 'Shift' });
		expect(screen.getByTitle('Delete')).toBeInTheDocument();
		
		// Release shift
		fireEvent.keyUp(document, { key: 'Shift' });
		expect(screen.queryByTitle(/Delete/)).not.toBeInTheDocument();
	});

	it('should handle multiple shift presses correctly', async () => {
		renderToolbar();
		
		// Press shift multiple times
		fireEvent.keyDown(document, { key: 'Shift' });
		fireEvent.keyDown(document, { key: 'Shift' });
		
		// Should only have one delete button
		const deleteButtons = screen.getAllByTitle('Delete');
		expect(deleteButtons).toHaveLength(1);
		
		// Release shift
		fireEvent.keyUp(document, { key: 'Shift' });
		expect(screen.queryByTitle(/Delete/)).not.toBeInTheDocument();
	});
});