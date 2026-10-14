import { describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import UsersTableFilters from './UsersTableFilters';

describe('UsersTableFilters', () => {
	it('hides the user status filter unless it is allowed', () => {
		render(<UsersTableFilters roleData={undefined} setUsersFilters={fn<FunctionLike>()} />, { wrapper: mockAppRoot().build() });

		expect(screen.queryByLabelText('User_Status')).not.toBeInTheDocument();
	});

	it('filters the users by how their status is managed', async () => {
		const setUsersFilters = fn<FunctionLike>();
		render(<UsersTableFilters roleData={undefined} setUsersFilters={setUsersFilters} showStatusManagementFilter />, {
			wrapper: mockAppRoot().build(),
		});

		await userEvent.click(screen.getByLabelText('User_Status'));
		await userEvent.click(await screen.findByRole('option', { name: 'Managed_status' }));

		expect(setUsersFilters).toHaveBeenLastCalledWith({ text: '', roles: [], statusManagement: 'managed' });

		await userEvent.click(screen.getByLabelText('User_Status'));
		await userEvent.click(await screen.findByRole('option', { name: 'All_user_statuses' }));

		expect(setUsersFilters).toHaveBeenLastCalledWith({ text: '', roles: [], statusManagement: undefined });
	});
});
