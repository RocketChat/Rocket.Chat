import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ABACUpsellModal from './ABACUpsellModal';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

jest.mock('../../GenericUpsellModal/hooks', () => ({
	useUpsellActions: jest.fn(() => ({
		shouldShowUpsell: true,
		cloudWorkspaceHadTrial: false,
		handleManageSubscription: jest.fn(),
		handleTalkToSales: jest.fn(),
	})),
}));

// Mock getURL utility
jest.mock('../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Premium_capability: 'Premium capability',
		Attribute_based_access_control: 'Attribute-Based Access Control',
		Attribute_based_access_control_title: 'Automate complex access management across your entire organization',
		Attribute_based_access_control_description:
			'ABAC automates room access, granting or revoking access based on dynamic user attributes rather than fixed roles.',
		Upgrade: 'Upgrade',
		Cancel: 'Cancel',
	})
	.withEndpoint('GET', '/v1/licenses.info', async () => ({
		license: createFakeLicenseInfo(),
	}))
	.build();

describe('ABACUpsellModal', () => {
	const mockOnClose = jest.fn();
	const mockOnConfirm = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render the modal with correct content', () => {
		const { baseElement } = render(<ABACUpsellModal onClose={mockOnClose} onConfirm={mockOnConfirm} />, { wrapper: appRoot });
		expect(baseElement).toMatchSnapshot();
	});

	it('should have no accessibility violations', async () => {
		const { container } = render(<ABACUpsellModal onClose={mockOnClose} onConfirm={mockOnConfirm} />, { wrapper: appRoot });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should call onConfirm when upgrade button is clicked', async () => {
		const user = userEvent.setup();
		render(<ABACUpsellModal onClose={mockOnClose} onConfirm={mockOnConfirm} />, { wrapper: appRoot });

		const upgradeButton = screen.getByRole('button', { name: 'Upgrade' });
		await user.click(upgradeButton);

		expect(mockOnConfirm).toHaveBeenCalledTimes(1);
		expect(mockOnClose).not.toHaveBeenCalled();
	});

	it('should call onClose when cancel button is clicked', async () => {
		const user = userEvent.setup();
		render(<ABACUpsellModal onClose={mockOnClose} onConfirm={mockOnConfirm} />, { wrapper: appRoot });

		const cancelButton = screen.getByRole('button', { name: 'Cancel' });
		await user.click(cancelButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
		expect(mockOnConfirm).not.toHaveBeenCalled();
	});

	it('should call onClose when close button is clicked', async () => {
		const user = userEvent.setup();
		render(<ABACUpsellModal onClose={mockOnClose} onConfirm={mockOnConfirm} />, { wrapper: appRoot });

		// Look for close button (usually has aria-label or is the X button)
		const closeButton = screen.getByRole('button', { name: /close/i });
		await user.click(closeButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
		expect(mockOnConfirm).not.toHaveBeenCalled();
	});

	it('should handle multiple button clicks correctly', async () => {
		const user = userEvent.setup();
		render(<ABACUpsellModal onClose={mockOnClose} onConfirm={mockOnConfirm} />, { wrapper: appRoot });

		const upgradeButton = screen.getByRole('button', { name: 'Upgrade' });
		const cancelButton = screen.getByRole('button', { name: 'Cancel' });

		// Click upgrade first
		await user.click(upgradeButton);
		expect(mockOnConfirm).toHaveBeenCalledTimes(1);

		// Click cancel
		await user.click(cancelButton);
		expect(mockOnClose).toHaveBeenCalledTimes(1);

		// Total calls
		expect(mockOnConfirm).toHaveBeenCalledTimes(1);
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});
