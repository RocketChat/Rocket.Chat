import { MockedAuthorizationContext, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PermissionsPage from './PermissionsPage';

jest.mock('./hooks/usePermissionsAndRoles', () => ({
	usePermissionsAndRoles: () => ({ permissions: [], total: 0, roleList: [] }),
}));

const renderPage = (permissions: string[]) =>
	render(
		<MockedAuthorizationContext permissions={permissions}>
			<PermissionsPage isEnterprise={false} />
		</MockedAuthorizationContext>,
		{ wrapper: mockAppRoot().build() },
	);

const bothPermissions = ['access-permissions', 'access-setting-permissions'];

describe('PermissionsPage', () => {
	it('starts on the Settings tab when only the settings permission is granted', () => {
		renderPage(['access-setting-permissions']);

		expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
	});

	it('switches to the Settings tab when access-permissions is revoked while Permissions is selected', () => {
		const { rerender } = renderPage(bothPermissions);
		expect(screen.getByRole('tab', { name: 'Permissions' })).toHaveAttribute('aria-selected', 'true');

		rerender(
			<MockedAuthorizationContext permissions={['access-setting-permissions']}>
				<PermissionsPage isEnterprise={false} />
			</MockedAuthorizationContext>,
		);

		expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tab', { name: 'Permissions' })).toHaveAttribute('aria-selected', 'false');
	});

	it('switches to the Permissions tab when access-setting-permissions is revoked while Settings is selected', async () => {
		const { rerender } = renderPage(bothPermissions);
		await userEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');

		rerender(
			<MockedAuthorizationContext permissions={['access-permissions']}>
				<PermissionsPage isEnterprise={false} />
			</MockedAuthorizationContext>,
		);

		expect(screen.getByRole('tab', { name: 'Permissions' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'false');
	});
});
