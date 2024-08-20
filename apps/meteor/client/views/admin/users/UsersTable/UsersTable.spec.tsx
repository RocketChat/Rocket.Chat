import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

import UsersTable from './UsersTable';

jest.mock('../../../../../app/models/client/models/Roles', () => ({ Roles: { findOne: () => undefined } }));
jest.mock('../../../../components/UserStatus', () => ({ UserStatus: () => null }));

const createUser = (freeSwitchExtension?: string) => ({
	_id: 'john.doe',
	username: 'john.doe',
	name: 'John Doe',
	createdAt: new Date(),
	active: true,
	_updatedAt: new Date(),
	roles: ['admin'],
	type: 'user',
	freeSwitchExtension,
});

it('should not render "Voice Call Extension" column when VoIP is disabled', () => {
	const mockUser = createUser('1000');
	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [mockUser], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', false).build(),
		},
	);

	expect(screen.queryByText('Voice_Call_Extension')).not.toBeInTheDocument();
	expect(screen.queryByTitle('Remove_Association')).not.toBeInTheDocument();
	expect(screen.queryByTitle('Associate_Extension')).not.toBeInTheDocument();
});

it('should render "Remove_Association" button when user has a associated extension', () => {
	const mockUser = createUser('1000');
	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [mockUser], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', true).build(),
		},
	);

	expect(screen.getByText('Voice_Call_Extension')).toBeInTheDocument();
	expect(screen.queryByTitle('Associate_Extension')).not.toBeInTheDocument();
	expect(screen.getByTitle('Remove_Association')).toBeEnabled();
});

it('should render "Associate_Extension" button when user has no associated extension', () => {
	const mockUser = createUser();
	render(
		<UsersTable
			filteredUsersQueryResult={{ isSuccess: true, data: { users: [mockUser], count: 1, offset: 1, total: 1 } } as any}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', true).build(),
		},
	);

	expect(screen.getByText('Voice_Call_Extension')).toBeInTheDocument();
	expect(screen.queryByTitle('Remove_Association')).not.toBeInTheDocument();
	expect(screen.getByTitle('Associate_Extension')).toBeEnabled();
});
