import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import RoomActionsMenu from './RoomActionsMenu';

const mockedFunction = jest.fn();
const regular = [
	{
		id: 'edit',
		name: 'Edit',
		icon: 'pencil' as const,
		action: mockedFunction,
	},
];
const danger = [
	{
		id: 'delete',
		name: 'Delete',
		icon: 'trash' as const,
		action: () => null,
		variant: 'danger',
	},
];

const actions = { regular, danger };

describe('Room Actions Menu', () => {
	it('should render kebab menu with the list content', async () => {
		render(<RoomActionsMenu actions={actions} />);

		userEvent.click(screen.getByRole('button'));

		expect(await screen.findByText('Edit')).toBeInTheDocument();
		expect(await screen.findByText('Delete')).toBeInTheDocument();
	});

	it('should have two different sections, regular and danger', async () => {
		render(<RoomActionsMenu actions={actions} />);

		userEvent.click(screen.getByRole('button'));

		expect(screen.getAllByRole('presentation')).toHaveLength(2);
		expect(screen.getByRole('separator')).toBeInTheDocument();
	});

	it('should render only the regular section if null is found in danger section', async () => {
		render(<RoomActionsMenu actions={{ regular, danger: null }} />);

		userEvent.click(screen.getByRole('button'));

		expect(screen.getAllByRole('presentation')).toHaveLength(1);
		expect(screen.queryByRole('separator')).not.toBeInTheDocument();
	});

	it('should call the action when item clicked', async () => {
		render(<RoomActionsMenu actions={actions} />);

		userEvent.click(screen.getByRole('button'));
		userEvent.click(screen.getAllByRole('menuitem')[0]);

		expect(mockedFunction).toHaveBeenCalled();
	});
});
