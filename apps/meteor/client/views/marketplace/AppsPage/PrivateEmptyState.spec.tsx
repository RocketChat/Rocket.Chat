import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import PrivateEmptyState from './PrivateEmptyState';
import { AppsContext } from '../../../contexts/AppsContext';

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useLicense: jest.fn(),
}));

describe('with private apps enabled', () => {
	beforeEach(async () => {
		const { useLicense } = await import('@rocket.chat/ui-client');
		(useLicense as jest.Mock).mockReturnValue({
			data: {
				limits: {
					privateApps: {
						max: 5,
					},
				},
			},
			isPending: false,
		});
	});

	const appRoot = mockAppRoot()
		.withTranslations('en', 'core', {
			Private_apps_upgrade_empty_state_title: 'Upgrade to unlock private apps',
			No_private_apps_installed: 'No private apps installed',
		})
		.wrap((children) => <AppsContext.Provider value={{ orchestrator: undefined }}>{children}</AppsContext.Provider>);

	it('should offer to upgrade to unlock private apps', () => {
		render(<PrivateEmptyState />, { wrapper: appRoot.build() });

		expect(screen.getByRole('heading', { name: 'No private apps installed' })).toBeInTheDocument();
	});
});

describe('without private apps enabled', () => {
	beforeEach(async () => {
		const { useLicense } = await import('@rocket.chat/ui-client');
		(useLicense as jest.Mock).mockReturnValue({
			data: {
				limits: {
					privateApps: {
						max: 0,
					},
				},
			},
			isPending: false,
		});
	});

	const appRoot = mockAppRoot()
		.withTranslations('en', 'core', {
			Private_apps_upgrade_empty_state_title: 'Upgrade to unlock private apps',
			No_private_apps_installed: 'No private apps installed',
		})
		.wrap((children) => <AppsContext.Provider value={{ orchestrator: undefined }}>{children}</AppsContext.Provider>);

	it('should offer to upgrade to unlock private apps', () => {
		render(<PrivateEmptyState />, { wrapper: appRoot.build() });

		expect(screen.getByRole('heading', { name: 'Upgrade to unlock private apps' })).toBeInTheDocument();
	});
});
