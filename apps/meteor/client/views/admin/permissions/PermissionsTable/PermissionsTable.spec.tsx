import type { IPermission, IRole } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import PermissionsTable from './PermissionsTable';
import * as stories from './PermissionsTable.stories';
import { createMockedPagination } from '../../../../../tests/mocks/data';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	// TODO: Needed to skip `label` because fuselage‘s `CheckBox` has a a11y empty label issue
	// TODO: Needed to skip `button-name` because fuselage‘s `Pagination` buttons are missing names
	const results = await axe(container, { rules: { 'label': { enabled: false }, 'button-name': { enabled: false } } });
	expect(results).toHaveNoViolations();
});

const paginationData = createMockedPagination();

const defaultPermissions: IPermission[] = [
	{
		_id: 'access-permissions',
		_updatedAt: new Date('2023-01-01'),
		roles: ['admin'],
	},
];

const roles: IRole[] = [
	{
		description: 'Owner of the workspace',
		name: 'owner',
		protected: true,
		scope: 'Users',
		_id: 'owner',
	},
	{
		description: 'Administrator',
		name: 'admin',
		protected: true,
		scope: 'Users',
		_id: 'admin',
	},
];

test('should display modal if the permission is access-permissions and has only one granted role', async () => {
	render(
		<PermissionsTable
			permissions={defaultPermissions}
			total={defaultPermissions.length}
			setFilter={() => undefined}
			roleList={roles}
			paginationData={paginationData}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	await userEvent.click(screen.getByRole('checkbox', { name: 'access-permissions - Administrator' }));
	expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('should NOT display modal if the permission is access-permissions and has more than one granted role', async () => {
	const morePermissions: IPermission[] = [
		{
			_id: 'access-permissions',
			_updatedAt: new Date('2023-01-01'),
			roles: ['admin', 'owner'],
		},
	];

	render(
		<PermissionsTable
			permissions={morePermissions}
			total={morePermissions.length}
			setFilter={() => undefined}
			roleList={roles}
			paginationData={paginationData}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	await userEvent.click(screen.getByRole('checkbox', { name: 'access-permissions - Administrator' }));
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
