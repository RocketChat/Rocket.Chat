import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';

import ReadReceiptRow from './ReadReceiptRow';

const readReceipt = {
	_id: 'read-receipt-id',
	messageId: 'message-id',
	roomId: 'room-id',
	userId: 'user-id',
	ts: new Date('2026-01-01T10:00:00.000Z'),
	user: { _id: 'user-id', name: 'John Doe', username: 'john.doe' },
	_updatedAt: new Date('2026-01-01T10:00:00.000Z'),
};

const renderRow = () =>
	render(<ReadReceiptRow {...readReceipt} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('UI_Use_Real_Name', true).build(),
	});

it('should render the display name of the user who read the message', () => {
	renderRow();

	expect(screen.getByRole('listitem')).toBeInTheDocument();
	expect(screen.getByText('John Doe')).toBeInTheDocument();
});

it('should match the snapshot', () => {
	const { container } = renderRow();

	expect(container).toMatchSnapshot();
});

it('should fall back to a skeleton, keeping the row aligned, when the avatar image fails to load', () => {
	renderRow();

	fireEvent.error(screen.getByRole('img', { hidden: true }));

	expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
	expect(screen.getByText('John Doe')).toBeInTheDocument();
});

it('should match the snapshot when the avatar image fails to load', () => {
	const { container } = renderRow();

	fireEvent.error(screen.getByRole('img', { hidden: true }));

	expect(container).toMatchSnapshot();
});
