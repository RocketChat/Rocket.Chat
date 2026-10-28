import { composeStories } from '@storybook/react-vite';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './Dropdown.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Dropdown Component]', () => {
	const dropdownOption = screen.queryByText('Example 1');

	it('renders without crashing', () => {
		render(<Default />);
	});

	it('should show dropdown when anchor is clicked once', async () => {
		const { getByTestId } = render(<Default {...Default.args} />);
		const anchor = getByTestId('dropdown-anchor');
		await userEvent.click(anchor);
		expect(await screen.findByTestId('dropdown')).toBeInTheDocument();
	});

	it('should hide dropdown when anchor is clicked twice', async () => {
		const { getByTestId } = render(<Default {...Default.args} />);
		const anchor = getByTestId('dropdown-anchor');
		await userEvent.click(anchor);
		await userEvent.click(anchor);
		expect(dropdownOption).toBeNull();
	});
});
