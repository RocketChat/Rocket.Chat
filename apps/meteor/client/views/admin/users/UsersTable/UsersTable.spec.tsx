import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import UsersTable from './UsersTable';
import * as stories from './UsersTable.stories';
import { createFakeUser } from '../../../../../tests/mocks/data';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	// TODO: Needed to skip `button-name` because fuselage‘s `Pagination` buttons are missing names
	const results = await axe(container, { rules: { 'button-name': { enabled: false } } });
	expect(results).toHaveNoViolations();
});

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
			isSuccess={true}
			isLoading={false}
			isError={false}
			users={[user] as unknown as Serialized<IUser>[]}
			total={1}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', false).build(),
		},
	);

	expect(screen.queryByText('Voice_call_extension')).not.toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('menu')).toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: /Assign_extension/ })).not.toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: /Unassign_extension/ })).not.toBeInTheDocument();
});

it('should not render voip extension column or actions if user doesnt have the required permission', async () => {
	const user = createFakeAdminUser('1000');

	render(
		<UsersTable
			isSuccess={true}
			isLoading={false}
			isError={false}
			users={[user] as unknown as Serialized<IUser>[]}
			total={1}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', true).build(),
		},
	);

	expect(screen.queryByText('Voice_call_extension')).not.toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('menu')).toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: /Assign_extension/ })).not.toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: /Unassign_extension/ })).not.toBeInTheDocument();
});

it('should render "Unassign_extension" button when user has a associated extension', async () => {
	const user = createFakeAdminUser('1000');

	render(
		<UsersTable
			isSuccess={true}
			isLoading={false}
			isError={false}
			users={[user] as unknown as Serialized<IUser>[]}
			total={1}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', true).withPermission('manage-voip-extensions').build(),
		},
	);

	expect(screen.getByText('Voice_call_extension')).toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('menu')).toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: /Assign_extension/ })).not.toBeInTheDocument();
	expect(screen.getByRole('menuitem', { name: /Unassign_extension/ })).toBeInTheDocument();
});

it('should render "Assign_extension" button when user has no associated extension', async () => {
	const user = createFakeAdminUser();

	render(
		<UsersTable
			isSuccess={true}
			isLoading={false}
			isError={false}
			users={[user] as unknown as Serialized<IUser>[]}
			total={1}
			setUserFilters={() => undefined}
			tab='all'
			onReload={() => undefined}
			paginationData={{} as any}
			sortData={{} as any}
			isSeatsCapExceeded={false}
			roleData={undefined}
		/>,
		{
			wrapper: mockAppRoot().withUser(user).withSetting('VoIP_TeamCollab_Enabled', true).withPermission('manage-voip-extensions').build(),
		},
	);

	expect(screen.getByText('Voice_call_extension')).toBeInTheDocument();

	screen.getByRole('button', { name: 'More_actions' }).click();
	expect(await screen.findByRole('menu')).toBeInTheDocument();
	expect(screen.getByRole('menuitem', { name: /Assign_extension/ })).toBeInTheDocument();
	expect(screen.queryByRole('menuitem', { name: /Unassign_extension/ })).not.toBeInTheDocument();
});
