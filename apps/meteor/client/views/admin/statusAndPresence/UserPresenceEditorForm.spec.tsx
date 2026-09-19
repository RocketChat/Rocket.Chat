import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserPresenceEditorForm from './UserPresenceEditorForm';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';

const managedAlice: ManagedPresenceUser = {
	_id: 'alice-id',
	username: 'alice',
	name: 'Alice',
	statusText: '',
	presenceDisabledByAdmin: false,
	statusVisibilityDeniedByAdmin: ['bob'],
};

const buildWrapper = (updateUser: jest.Mock, managedUsers: ManagedPresenceUser[] = []) =>
	mockAppRoot()
		.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [] }))
		.withEndpoint('GET', '/v1/users.listStatusVisibility', () => ({
			users: managedUsers,
			count: managedUsers.length,
			offset: 0,
			total: managedUsers.length,
		}))
		.withEndpoint('GET', '/v1/users.info', () => ({ user: { _id: 'alice-id', username: 'alice' } }) as any)
		.withEndpoint('POST', '/v1/users.update', updateUser)
		.build();

const toggleShowStatusAndSave = async () => {
	await userEvent.click(screen.getByRole('checkbox', { name: 'Show_status' }));
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));
};

describe('UserPresenceEditorForm', () => {
	let updateUser: jest.Mock;
	let onClose: jest.Mock;

	beforeEach(() => {
		updateUser = jest.fn(async () => ({ user: {} }));
		onClose = jest.fn();
	});

	it('shows the user it was opened for as a fixed field', () => {
		render(<UserPresenceEditorForm defaultUsername='alice' onClose={onClose} />, { wrapper: buildWrapper(updateUser) });

		const userField = screen.getByRole('textbox', { name: 'User' });
		expect(userField).toHaveValue('alice');
		expect(userField).toBeDisabled();
	});

	it('saves the rules of a user without rules straight away', async () => {
		render(<UserPresenceEditorForm defaultUsername='alice' onClose={onClose} />, { wrapper: buildWrapper(updateUser) });

		await toggleShowStatusAndSave();

		await waitFor(() =>
			expect(updateUser).toHaveBeenCalledWith({
				userId: 'alice-id',
				data: { presenceDisabledByAdmin: true, statusVisibilityDeniedByAdmin: [] },
			}),
		);
		expect(onClose).toHaveBeenCalled();
	});

	it('asks before replacing the rules a user already has', async () => {
		render(<UserPresenceEditorForm defaultUsername='alice' onClose={onClose} />, { wrapper: buildWrapper(updateUser, [managedAlice]) });

		await toggleShowStatusAndSave();

		const dialog = await screen.findByRole('dialog', { name: 'Replace_user_status_settings' });
		expect(updateUser).not.toHaveBeenCalled();

		await userEvent.click(within(dialog).getByRole('button', { name: 'Replace' }));

		await waitFor(() => expect(updateUser).toHaveBeenCalled());
		expect(onClose).toHaveBeenCalled();
	});

	it('removes the rules of a user after confirmation', async () => {
		render(<UserPresenceEditorForm user={managedAlice} defaultUsername='alice' onClose={onClose} />, { wrapper: buildWrapper(updateUser) });

		await userEvent.click(screen.getByRole('button', { name: 'Remove_user_presence_settings' }));

		const dialog = await screen.findByRole('dialog', { name: 'Remove_user_presence_settings' });
		await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

		await waitFor(() =>
			expect(updateUser).toHaveBeenCalledWith({
				userId: 'alice-id',
				data: { presenceDisabledByAdmin: false, statusVisibilityDeniedByAdmin: [], statusText: '' },
			}),
		);
		expect(onClose).toHaveBeenCalled();
	});
});
