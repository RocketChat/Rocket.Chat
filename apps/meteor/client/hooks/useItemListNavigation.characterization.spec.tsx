import { IconButton, Item, ItemActions, ItemContent, ItemGroup, ItemLink, ItemTitle } from '@rocket.chat/fuselage';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useItemListNavigation } from './useItemListNavigation';

// G0 characterization of the composite list model on the real Fuselage `Item` parts: a list is one tab stop, the arrows move
// between rows, and Tab walks the controls of the focused row and then leaves the list.
const rooms = ['alpha', 'bravo', 'charlie'];

const List = () => {
	const ref = useItemListNavigation();

	return (
		<>
			<button type='button'>before</button>
			<ItemGroup is='ul' ref={ref} aria-label='Rooms'>
				{rooms.map((room) => (
					<Item is='li' key={room} interactive>
						<ItemContent>
							<ItemTitle>
								<ItemLink href={`#${room}`} onClick={(event) => event.preventDefault()}>
									{room}
								</ItemLink>
							</ItemTitle>
						</ItemContent>
						<ItemActions reveal='hover'>
							<IconButton size='mini' icon='kebab' aria-label={`Options for ${room}`} />
						</ItemActions>
					</Item>
				))}
			</ItemGroup>
			<button type='button'>after</button>
		</>
	);
};

describe('a list of Item rows', () => {
	beforeAll(() => {
		jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
			callback(0);
			return 0;
		});
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	it('moves between the links with Down and Up, skipping the row actions', async () => {
		const user = userEvent.setup();
		render(<List />);

		screen.getByRole('link', { name: 'alpha' }).focus();
		await user.keyboard('{ArrowDown}');
		expect(screen.getByRole('link', { name: 'bravo' })).toHaveFocus();

		await user.keyboard('{ArrowDown}');
		expect(screen.getByRole('link', { name: 'charlie' })).toHaveFocus();

		await user.keyboard('{ArrowUp}{ArrowUp}');
		expect(screen.getByRole('link', { name: 'alpha' })).toHaveFocus();
	});

	it('walks the actions of the focused row with Tab, then leaves the list without entering the next row', async () => {
		const user = userEvent.setup();
		render(<List />);

		screen.getByRole('link', { name: 'alpha' }).focus();
		await user.tab();
		expect(screen.getByRole('button', { name: 'Options for alpha' })).toHaveFocus();

		await user.tab();
		expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
	});

	it('returns from an action to its row link with Escape', async () => {
		const user = userEvent.setup();
		render(<List />);

		screen.getByRole('link', { name: 'bravo' }).focus();
		await user.tab();
		expect(screen.getByRole('button', { name: 'Options for bravo' })).toHaveFocus();

		await user.keyboard('{Escape}');
		expect(screen.getByRole('link', { name: 'bravo' })).toHaveFocus();
	});

	it('finds the rows and links by the class contract the hook reads', () => {
		render(<List />);

		const list = screen.getByRole('list', { name: 'Rooms' });
		expect(list.querySelectorAll('.rcx-item')).toHaveLength(rooms.length);
		expect(list.querySelectorAll('.rcx-item__link')).toHaveLength(rooms.length);
		expect(list.querySelectorAll('.rcx-item__actions--reveal-hover button')).toHaveLength(rooms.length);
	});
});
