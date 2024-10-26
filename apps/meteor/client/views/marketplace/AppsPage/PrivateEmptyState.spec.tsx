import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';

import PrivateEmptyState from './PrivateEmptyState';
import { useLicense } from '../../../hooks/useLicense';

jest.mock('../../../hooks/useLicense', () => ({
	useLicense: jest.fn(),
}));

const mockedUseLicense = jest.mocked(useLicense);

describe('with private apps enabled', () => {
	beforeAll(() => {
		mockedUseLicense.mockImplementation(
			() =>
				({
					data: { limits: { privateApps: { max: 1 } } },
				}) as any,
		);
	});

	it('should offer to upgrade to unlock private apps', () => {
		render(<PrivateEmptyState />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Private_apps_upgrade_empty_state_title: 'Upgrade to unlock private apps',
					No_private_apps_installed: 'No private apps installed',
				})
				.build(),
			legacyRoot: true,
		});

		expect(screen.getByRole('heading', { name: 'No private apps installed' })).toBeInTheDocument();
	});
});

describe('without private apps enabled', () => {
	beforeAll(() => {
		mockedUseLicense.mockImplementation(
			() =>
				({
					data: { limits: { privateApps: { max: 0 } } },
				}) as any,
		);
	});

	it('should offer to upgrade to unlock private apps', () => {
		render(<PrivateEmptyState />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Private_apps_upgrade_empty_state_title: 'Upgrade to unlock private apps',
					No_private_apps_installed: 'No private apps installed',
				})
				.build(),
			legacyRoot: true,
		});

		expect(screen.getByRole('heading', { name: 'Upgrade to unlock private apps' })).toBeInTheDocument();
	});
});
