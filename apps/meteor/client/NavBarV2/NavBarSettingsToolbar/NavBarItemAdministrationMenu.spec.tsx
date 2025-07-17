import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarItemAdministrationMenu from './NavBarItemAdministrationMenu';

const handleMenuClick = async () => {
	const menuButton = await screen.findByRole('button', { name: 'Manage' });
	await userEvent.click(menuButton);
};

it('should not display the menu if no permission is set', async () => {
	render(<NavBarItemAdministrationMenu />, { wrapper: mockAppRoot().build() });

	expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument();
});

it('should display the workspace menu item if at least one admin permission is set', async () => {
	render(<NavBarItemAdministrationMenu />, { wrapper: mockAppRoot().withPermission('access-permissions').build() });

	await handleMenuClick();
	expect(await screen.findByRole('menuitem', { name: 'Workspace' })).toBeInTheDocument();
});

it('should display the omnichannel menu item if view-livechat-manager permission is set', async () => {
	render(<NavBarItemAdministrationMenu />, {
		wrapper: mockAppRoot().withPermission('view-livechat-manager').withPermission('access-permissions').build(),
	});

	await handleMenuClick();
	expect(await screen.findByRole('menuitem', { name: 'Omnichannel' })).toBeInTheDocument();
});

it('should not display any audit items if has at least one admin permission, some audit permission and the auditing module is not enabled', async () => {
	render(<NavBarItemAdministrationMenu />, {
		wrapper: mockAppRoot().withPermission('access-permissions').withPermission('can-audit').build(),
	});

	await handleMenuClick();
	expect(screen.queryByRole('menuitem', { name: 'Messages' })).not.toBeInTheDocument();
});

it('should display audit items if has at least one admin permission, both audit permission and the auditing module is enabled', async () => {
	render(<NavBarItemAdministrationMenu />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				license: {
					license: {
						// @ts-expect-error: just for testing
						grantedModules: [{ module: 'auditing' }],
					},
					// @ts-expect-error: just for testing
					activeModules: ['auditing'],
				},
			}))
			.withJohnDoe()
			.withPermission('can-audit')
			.withPermission('can-audit-log')
			.build(),
	});

	await handleMenuClick();
	await waitFor(() => {
		expect(screen.getByText('Messages')).toBeInTheDocument();
	});

	expect(await screen.findByRole('menuitem', { name: 'Messages' })).toBeInTheDocument();
	expect(await screen.findByRole('menuitem', { name: 'Logs' })).toBeInTheDocument();
});
