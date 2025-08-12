import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { DOWNGRADE_LINK } from '../utils/links';

it('should display plan name in the title', async () => {
	const confirmFn = jest.fn();
	render(<CancelSubscriptionModal planName='Starter' onConfirm={confirmFn} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Cancel__planName__subscription: 'Cancel {{planName}} subscription',
			})
			.build(),
	});

	expect(screen.getByText('Cancel Starter subscription')).toBeInTheDocument();
});

it('should have link to downgrade docs', async () => {
	render(<CancelSubscriptionModal planName='Starter' onConfirm={jest.fn()} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Cancel__planName__subscription: 'Cancel {{planName}} subscription',
				Cancel_subscription_message:
					'<strong>This workspace will downgrage to Community and lose free access to premium capabilities.</strong><br/><br/> While you can keep using Rocket.Chat, your team will lose access to unlimited mobile push notifications, read receipts, marketplace apps <4>and other capabilities</4>.',
			})
			.build(),
	});

	expect(screen.getByRole('link', { name: 'and other capabilities' })).toHaveAttribute('href', DOWNGRADE_LINK);
});

it('should call onConfirm when confirm button is clicked', async () => {
	const confirmFn = jest.fn();
	render(<CancelSubscriptionModal planName='Starter' onConfirm={confirmFn} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'Cancel_subscription' }));
	expect(confirmFn).toHaveBeenCalled();
});

it('should call onCancel when "Dont cancel" button is clicked', async () => {
	const cancelFn = jest.fn();
	render(<CancelSubscriptionModal planName='Starter' onConfirm={jest.fn()} onCancel={cancelFn} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'Dont_cancel' }));
	expect(cancelFn).toHaveBeenCalled();
});

it('should call onCancel when close button is clicked', async () => {
	const cancelFn = jest.fn();
	render(<CancelSubscriptionModal planName='Starter' onConfirm={jest.fn()} onCancel={cancelFn} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'Close' }));
	expect(cancelFn).toHaveBeenCalled();
});
