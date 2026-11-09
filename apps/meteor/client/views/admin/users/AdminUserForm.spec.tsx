import type { IUser, LicenseModule, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AdminUserForm from './AdminUserForm';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

const statusDisabledAlice = {
	_id: 'alice-id',
	username: 'alice',
	name: 'Alice',
	emails: [{ address: 'alice@example.com', verified: true }],
	roles: ['user'],
	presenceDisabledByAdmin: true,
} as unknown as Serialized<IUser>;

const buildWrapper = (saveUser: jest.Mock, activeModules: LicenseModule[] = ['unlimited-presence']) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Accounts_UserStatus_Enabled', true)
		.withSetting('Accounts_StatusVisibility_Admin_Enabled', true)
		.withSetting('Accounts_Registration_Users_Default_Roles', 'user')
		.withPermission('edit-other-user-info')
		.withPermission('view-full-other-user-info')
		.withEndpoint('GET', '/v1/licenses.info', () => ({ license: createFakeLicenseInfo({ activeModules }) }))
		.withEndpoint('GET', '/v1/smtp.check', () => ({ isSMTPConfigured: false }) as any)
		.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [] }))
		.withEndpoint('POST', '/v1/users.update', saveUser)
		.withEndpoint('POST', '/v1/users.create', saveUser)
		.withEndpoint('POST', '/v1/statistics.telemetry', () => undefined)
		.build();

const renderForm = (updateUser: jest.Mock) =>
	render(<AdminUserForm userData={statusDisabledAlice} onReload={jest.fn()} context='edit' roleData={{ roles: [] }} roleError={null} />, {
		wrapper: buildWrapper(updateUser),
	});

describe('AdminUserForm', () => {
	let updateUser: jest.Mock;

	beforeEach(() => {
		updateUser = jest.fn(async () => ({ user: { _id: 'alice-id' } }));
	});

	it('keeps the stored status message when the status is turned back on without editing it', async () => {
		renderForm(updateUser);

		await userEvent.click(await screen.findByRole('checkbox', { name: 'Show_status' }));
		await userEvent.click(screen.getByRole('button', { name: 'Save_user' }));

		await waitFor(() => expect(updateUser).toHaveBeenCalled());
		expect(updateUser.mock.calls[0][0].data).toMatchObject({ presenceDisabledByAdmin: false });
		expect(updateUser.mock.calls[0][0].data).not.toHaveProperty('statusText');
	});

	it('saves the status message once the admin edits it', async () => {
		renderForm(updateUser);

		await userEvent.click(await screen.findByRole('checkbox', { name: 'Show_status' }));
		await userEvent.type(screen.getByRole('textbox', { name: 'StatusMessage' }), 'Back Monday');
		await userEvent.click(screen.getByRole('button', { name: 'Save_user' }));

		await waitFor(() => expect(updateUser).toHaveBeenCalled());
		expect(updateUser.mock.calls[0][0].data).toMatchObject({ presenceDisabledByAdmin: false, statusText: 'Back Monday' });
	});

	it('creates the user without the status fields when the license lacks the presence module', async () => {
		const createUser: jest.Mock = jest.fn(async () => ({ user: { _id: 'bob-id' } }));
		render(<AdminUserForm onReload={jest.fn()} context='new' roleData={{ roles: [] }} roleError={null} />, {
			wrapper: buildWrapper(createUser, []),
		});

		await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), 'bob@example.com');
		await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Bob');
		await userEvent.type(screen.getByRole('textbox', { name: 'Username' }), 'bob');
		await userEvent.type(screen.getByPlaceholderText('Password'), 'Local-Test-Pw-9');
		await userEvent.type(screen.getByPlaceholderText('Confirm_password'), 'Local-Test-Pw-9');
		await userEvent.click(screen.getByRole('button', { name: 'Add_user' }));

		await waitFor(() => expect(createUser).toHaveBeenCalled());
		expect(screen.queryByRole('checkbox', { name: 'Show_status' })).not.toBeInTheDocument();
		expect(createUser.mock.calls[0][0]).not.toHaveProperty('presenceDisabledByAdmin');
	});
});
