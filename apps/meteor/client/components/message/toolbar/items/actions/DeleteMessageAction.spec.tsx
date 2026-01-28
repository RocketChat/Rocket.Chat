import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import DeleteMessageAction from './DeleteMessageAction';

// Mock the useDeleteMessageAction hook
const mockDeleteAction = {
	id: 'delete-message',
	icon: 'trash',
	label: 'Delete',
	action: jest.fn(),
};

jest.mock('../../useDeleteMessageAction', () => ({
	useDeleteMessageAction: jest.fn(),
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

describe('DeleteMessageAction', () => {
	const { useDeleteMessageAction } = require('../../useDeleteMessageAction');

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render delete button when user has permission', () => {
		useDeleteMessageAction.mockReturnValue(mockDeleteAction);

		render(
			<DeleteMessageAction
				message={mockMessage as any}
				room={mockRoom as any}
				subscription={mockSubscription as any}
			/>,
			{
				wrapper: mockAppRoot().build(),
			}
		);

	expect(screen.getByTitle('Delete')).toBeInTheDocument();
		expect(screen.getByRole('button')).toHaveAttribute('data-qa-id', 'delete-message');
	});

	it('should not render when user lacks permission', () => {
		useDeleteMessageAction.mockReturnValue(null);

		const { container } = render(
			<DeleteMessageAction
				message={mockMessage as any}
				room={mockRoom as any}
				subscription={mockSubscription as any}
			/>,
			{
				wrapper: mockAppRoot().build(),
			}
		);

		expect(container.firstChild).toBeNull();
	});

	it('should call delete action when clicked', () => {
		useDeleteMessageAction.mockReturnValue(mockDeleteAction);

		render(
			<DeleteMessageAction
				message={mockMessage as any}
				room={mockRoom as any}
				subscription={mockSubscription as any}
			/>,
			{
				wrapper: mockAppRoot().build(),
			}
		);

		const deleteButton = screen.getByRole('button');
		deleteButton.click();

		expect(mockDeleteAction.action).toHaveBeenCalled();
	});
});