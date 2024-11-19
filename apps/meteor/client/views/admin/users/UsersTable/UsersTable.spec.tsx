import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UsersTable from './UsersTable';
import { createFakeUser } from '../../../../../tests/mocks/data';

const createFakeAdminUser = (freeSwitchExtension?: string) =>
	createFakeUser({
		active: true,
		roles: ['admin'],
		type: 'user',
		freeSwitchExtension,
	});

it('should not render voip extension column when voice call is disabled', async () => {
	const user = createFakeAdminUser('1000');

	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [user], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			legacyRoot: true,
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', false).build(),
		},
	);

	expect(screen.queryByText('Voice_call_extension')).not.toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('listbox')).toBeInTheDocument();
	expect(screen.queryByRole('option', { name: /Assign_extension/ })).not.toBeInTheDocument();
	expect(screen.queryByRole('option', { name: /Unassign_extension/ })).not.toBeInTheDocument();
});

it('should not render voip extension column or actions if user doesnt have the required permission', async () => {
	const user = createFakeAdminUser('1000');

	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [user], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			legacyRoot: true,
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', true).build(),
		},
	);

	expect(screen.queryByText('Voice_call_extension')).not.toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('listbox')).toBeInTheDocument();
	expect(screen.queryByRole('option', { name: /Assign_extension/ })).not.toBeInTheDocument();
	expect(screen.queryByRole('option', { name: /Unassign_extension/ })).not.toBeInTheDocument();
});

it('should render "Unassign_extension" button when user has a associated extension', async () => {
	const user = createFakeAdminUser('1000');

	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [user], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			legacyRoot: true,
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', true).withPermission('manage-voip-extensions').build(),
		},
	);

	expect(screen.getByText('Voice_call_extension')).toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('listbox')).toBeInTheDocument();
	expect(screen.queryByRole('option', { name: /Assign_extension/ })).not.toBeInTheDocument();
	expect(screen.getByRole('option', { name: /Unassign_extension/ })).toBeInTheDocument();
});

it('should render "Assign_extension" button when user has no associated extension', async () => {
	const user = createFakeAdminUser();

	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [user], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			legacyRoot: true,
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', true).withPermission('manage-voip-extensions').build(),
		},
	);

	expect(screen.getByText('Voice_call_extension')).toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('listbox')).toBeInTheDocument();
	expect(screen.getByRole('option', { name: /Assign_extension/ })).toBeInTheDocument();
	expect(screen.queryByRole('option', { name: /Unassign_extension/ })).not.toBeInTheDocument();
});
