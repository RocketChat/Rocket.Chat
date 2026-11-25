import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dropdown from './Dropdown';
import * as stories from './Dropdown.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Dropdown Component]', () => {
	const dropdownOption = screen.queryByText('Example 1');

	it('renders without crashing', () => {
		render(<Default />);
		expect(screen.getByTestId('dropdown-anchor')).toBeInTheDocument();
	});

	it('should show dropdown when anchor is clicked once', async () => {
		render(<Default {...Default.args} />);
		const anchor = screen.getByTestId('dropdown-anchor');
		await userEvent.click(anchor);
		expect(await screen.findByTestId('dropdown')).toBeInTheDocument();
	});

	it('should hide dropdown when anchor is clicked twice', async () => {
		render(<Default {...Default.args} />);
		const anchor = screen.getByTestId('dropdown-anchor');
		await userEvent.click(anchor);
		await userEvent.click(anchor);
		expect(dropdownOption).toBeNull();
	});

	it('should forward id and aria attributes to the surface', () => {
		const reference = { current: document.body };
		render(
			<Dropdown reference={reference} id='menu' aria-label='Menu'>
				content
			</Dropdown>,
		);

		expect(screen.getByTestId('dropdown')).toHaveAttribute('id', 'menu');
		expect(screen.getByTestId('dropdown')).toHaveAttribute('aria-label', 'Menu');
	});
});
