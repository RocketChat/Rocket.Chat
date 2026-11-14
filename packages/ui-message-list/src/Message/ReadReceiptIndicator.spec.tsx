import { render, screen } from '@testing-library/react';

import ReadReceiptIndicator from './ReadReceiptIndicator';

it('shows a single check named sent while the message is unread, and a double check named viewed once read (R16)', () => {
	const { rerender } = render(<ReadReceiptIndicator mid='messageId' unread />);

	expect(screen.getByRole('status', { name: 'Message_sent' })).toHaveAttribute('id', 'messageId-read-status');
	expect(document.querySelector('.rcx-icon--name-check-single')).toBeInTheDocument();

	rerender(<ReadReceiptIndicator mid='messageId' unread={false} />);

	expect(screen.getByRole('status', { name: 'Message_viewed' })).toBeInTheDocument();
	expect(document.querySelector('.rcx-icon--name-check-double')).toBeInTheDocument();
});
