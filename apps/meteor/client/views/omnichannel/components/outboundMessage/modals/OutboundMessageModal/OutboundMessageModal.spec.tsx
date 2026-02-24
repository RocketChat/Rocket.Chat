import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OutboundMessageModal from './OutboundMessageModal';

jest.mock('../../components/OutboundMessageWizard', () => ({
	__esModule: true,
	default: () => <div>Outbound message Wizard</div>,
}));

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Close: 'Close',
		Discard: 'Discard',
		Discard_message: 'Discard message',
		Outbound_message: 'Outbound message',
		This_action_cannot_be_undone: 'This action cannot be undone',
		Keep_editing: 'Keep editing',
		Are_you_sure_you_want_to_discard_this_outbound_message: 'Are you sure you want to discard this outbound message?',
	})
	.build();

it('should display confirmation before closing the modal', async () => {
	const onClose = jest.fn();
	render(<OutboundMessageModal onClose={onClose} />, { wrapper: appRoot });

	expect(screen.getByRole('dialog', { name: 'Outbound message' })).toBeInTheDocument();
	expect(screen.queryByRole('dialog', { name: 'Discard message' })).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Close' }));

	expect(screen.getByRole('dialog', { name: 'Discard message' })).toBeInTheDocument();
	expect(screen.getByRole('dialog', { name: 'Discard message' })).toHaveAccessibleDescription(
		'Are you sure you want to discard this outbound message?',
	);

	await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
	expect(onClose).toHaveBeenCalled();
});

it('should close confirmation and leave modal open when cancel is clicked', async () => {
	const onClose = jest.fn();
	render(<OutboundMessageModal onClose={onClose} />, { wrapper: appRoot });

	await userEvent.click(screen.getByRole('button', { name: 'Close' }));

	expect(screen.getByRole('dialog', { name: 'Discard message' })).toBeInTheDocument();
	expect(screen.getByRole('dialog', { name: 'Discard message' })).toHaveAccessibleDescription(
		'Are you sure you want to discard this outbound message?',
	);

	await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

	expect(screen.queryByRole('dialog', { name: 'Discard message' })).not.toBeInTheDocument();
	expect(screen.getByRole('dialog', { name: 'Outbound message' })).toBeInTheDocument();
	expect(onClose).not.toHaveBeenCalled();
});
