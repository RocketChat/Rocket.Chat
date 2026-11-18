import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './CheckBox.stories';
import { render } from '../../testing';

const { Default, Indeterminate, Disabled, DefaultChecked } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[CheckBox Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[CheckBox Interacting]', () => {
	it('changes style of element as checkbox is checked', async () => {
		const user = userEvent.setup();
		render(<Default />);
		const checkbox = screen.getByRole('checkbox');
		await user.click(checkbox);
		expect(checkbox).toBeChecked();
	});
	it('changes style of element as checkbox is checked/unchecked', async () => {
		const user = userEvent.setup();
		render(<Default />);
		const checkbox = screen.getByRole('checkbox');
		await user.click(checkbox);
		await user.click(checkbox);
		expect(checkbox).not.toBeChecked();
	});
	it('displays checkbox indeterminate correctly', () => {
		render(<Indeterminate />);
		expect(screen.getByRole('checkbox')).toBePartiallyChecked();
	});

	it('displays checkbox with defaultChecked value correctly', () => {
		render(<DefaultChecked />);
		expect(screen.getByRole('checkbox')).toBeChecked();
	});

	it('displays checkbox disabled correctly', () => {
		render(<Disabled />);
		expect(screen.getByRole('checkbox')).toBeDisabled();
	});
});
