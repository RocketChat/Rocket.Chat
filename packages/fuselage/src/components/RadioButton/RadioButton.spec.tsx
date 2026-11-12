import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './RadioButton.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const { Default, Checked, Disabled } = composeStories(stories);

describe('[RadioButton Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[RadioButton Interacting]', () => {
	it('changes style of element as radio button is checked', async () => {
		const user = userEvent.setup();
		render(<Default />);
		const radioButton = screen.getByRole('radio');
		await user.click(radioButton);
		expect(radioButton).toBeChecked();
	});
	it('displays radio button with defaultChecked value correctly', () => {
		render(<Checked />);
		expect(screen.getByRole('radio')).toBeChecked();
	});
	it('displays radio button disabled correctly', () => {
		render(<Disabled />);
		expect(screen.getByRole('radio')).toBeDisabled();
	});
});
