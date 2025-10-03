import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import AdminABACSettingToggle from './AdminABACSettingToggle';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';

const baseAppRoot = mockAppRoot()
	.wrap((children) => <EditableSettingsProvider>{children}</EditableSettingsProvider>)
	.withTranslations('en', 'core', {
		ABAC_Enabled: 'Enable ABAC',
		ABAC_Enabled_Description: 'Enable Attribute-Based Access Control',
		ABAC_Warning_Modal_Title: 'Disable ABAC',
		ABAC_Warning_Modal_Confirm_Text: 'Disable',
		Cancel: 'Cancel',
	})
	.withEndpoint('GET', '/v1/licenses.info', () => ({
		license: createFakeLicenseInfo({ activeModules: ['abac'] }),
	}));

describe('AdminABACSettingToggle', () => {
	it('should render the setting toggle when setting exists', () => {
		const { baseElement } = render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', true).build(),
		});
		expect(baseElement).toMatchSnapshot();
	});

	it('should show warning modal when disabling ABAC', async () => {
		const user = userEvent.setup();
		render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', true).build(),
		});

		const toggle = screen.getByRole('checkbox');
		await user.click(toggle);

		await waitFor(() => {
			expect(screen.getByText('Disable ABAC')).toBeInTheDocument();
		});

		// TODO: discover how to automatically unmount all modals after each test
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await user.click(cancelButton);
	});

	it('should not show warning modal when enabling ABAC', async () => {
		const user = userEvent.setup();
		render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', false).build(),
		});

		const toggle = screen.getByRole('checkbox');
		await user.click(toggle);

		// The modal should not appear when enabling ABAC
		expect(screen.queryByText('Disable ABAC')).not.toBeInTheDocument();
	});

	it('should show warning modal when resetting setting', async () => {
		const user = userEvent.setup();
		render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', true).build(),
		});

		const resetButton = screen.getByRole('button', { name: /reset/i });
		await user.click(resetButton);

		await waitFor(() => {
			expect(screen.getByText('Disable ABAC')).toBeInTheDocument();
		});

		// TODO: discover how to automatically unmount all modals after each test
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await user.click(cancelButton);
	});

	it('should have no accessibility violations', async () => {
		const { container } = render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', true).build(),
		});
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should handle setting change correctly', async () => {
		const user = userEvent.setup();
		render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', false).build(),
		});

		const toggle = screen.getByRole('checkbox');
		expect(toggle).not.toBeChecked();

		await user.click(toggle);
		expect(toggle).toBeChecked();
	});

	it('should be disabled when abac license is not installed', () => {
		const { baseElement } = render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot
				.withSetting('ABAC_Enabled', true)
				.withEndpoint('GET', '/v1/licenses.info', () => ({
					license: createFakeLicenseInfo({ activeModules: [] }),
				}))
				.build(),
		});

		const toggle = screen.getByRole('checkbox');
		expect(toggle).toBeDisabled();
		expect(baseElement).toMatchSnapshot();
	});

	it('should show reset button when value differs from package value', () => {
		render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', true).build(),
		});

		expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
	});

	it('should not show reset button when value matches package value', () => {
		render(<AdminABACSettingToggle />, {
			wrapper: baseAppRoot.withSetting('ABAC_Enabled', false).build(),
		});

		expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
	});
});
