import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GenericMenu from './GenericMenu';

const mockedFunction = jest.fn();
const regular = {
	items: [
		{
			id: 'edit',
			content: 'Edit',
			icon: 'pencil' as const,
			onClick: mockedFunction,
		},
	],
};
const danger = {
	items: [
		{
			id: 'delete',
			content: 'Delete',
			icon: 'trash' as const,
			onClick: () => null,
			variant: 'danger',
		},
	],
};

const sections = [regular, danger];

describe('Room Actions Menu', () => {
	it('should render kebab menu with the list content', async () => {
		render(<GenericMenu title='Kebab' sections={sections} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button'));

		expect(await screen.findByText('Edit')).toBeInTheDocument();
		expect(await screen.findByText('Delete')).toBeInTheDocument();
	});

	it('should have two different sections, regular and danger', async () => {
		render(<GenericMenu title='Kebab' sections={sections} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button'));

		expect(screen.getAllByRole('presentation')).toHaveLength(2);
		expect(screen.getByRole('separator')).toBeInTheDocument();
	});

	it('should call the action when item clicked', async () => {
		render(<GenericMenu title='Kebab' sections={sections} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button'));
		await userEvent.click(screen.getAllByRole('menuitem')[0]);

		expect(mockedFunction).toHaveBeenCalled();
	});
});
