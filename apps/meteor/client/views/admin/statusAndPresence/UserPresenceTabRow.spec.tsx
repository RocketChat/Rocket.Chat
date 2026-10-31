import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserPresenceTabRow from './UserPresenceTabRow';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';

const managedAlice: ManagedPresenceUser = {
	_id: 'alice-id',
	username: 'alice',
	name: 'Alice',
	statusText: '',
	presenceDisabledByAdmin: true,
	statusVisibilityDeniedByAdmin: [],
};

const renderRow = (updateUser: jest.Mock, onClick: jest.Mock) =>
	render(
		<table>
			<tbody>
				<UserPresenceTabRow user={managedAlice} onClick={onClick} />
			</tbody>
		</table>,
		{ wrapper: mockAppRoot().withEndpoint('POST', '/v1/users.update', updateUser).build() },
	);

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'More_actions' }));

describe('UserPresenceTabRow', () => {
	let updateUser: jest.Mock;
	let onClick: jest.Mock;

	beforeEach(() => {
		updateUser = jest.fn(async () => ({ user: {} }));
		onClick = jest.fn();
	});

	it('opens the user from the manage action', async () => {
		renderRow(updateUser, onClick);

		await openMenu();
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Manage_user_status' }));

		expect(onClick).toHaveBeenCalledWith(managedAlice);
	});

	it('resets the rules of the user after confirmation', async () => {
		renderRow(updateUser, onClick);

		await openMenu();
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Reset_managed_status_settings' }));

		const dialog = await screen.findByRole('dialog', { name: 'Remove_user_status_settings' });
		expect(updateUser).not.toHaveBeenCalled();

		await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));

		await waitFor(() =>
			expect(updateUser).toHaveBeenCalledWith({
				userId: 'alice-id',
				data: { presenceDisabledByAdmin: false, statusVisibilityDeniedByAdmin: [], statusText: '' },
			}),
		);
		expect(onClick).not.toHaveBeenCalled();
	});
});
