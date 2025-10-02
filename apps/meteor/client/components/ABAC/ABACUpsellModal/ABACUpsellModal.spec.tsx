import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import ABACUpsellModal from './ABACUpsellModal';

// Mock the hooks used by ABACUpsellModal
jest.mock('../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: jest.fn(() => false),
}));

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
	.build();

describe('ABACUpsellModal', () => {
	it('should render the modal with correct content', () => {
		const { baseElement } = render(<ABACUpsellModal />, { wrapper: appRoot });
		expect(baseElement).toMatchSnapshot();
	});

	it('should have no accessibility violations', async () => {
		const { container } = render(<ABACUpsellModal />, { wrapper: appRoot });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
