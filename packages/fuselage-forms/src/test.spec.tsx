import { composeStories } from '@storybook/react-webpack5';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './Field/Field.stories';

const composedStories = composeStories(stories);

const {
	WithSelect: _select,
	WithCheckbox,
	WithRadioButton,
	WithToggleSwitch,
	WithTextArea,
	WithMultiSelect,
	WithSlider,
	WithAutoComplete,
	WithAutoCompleteMultiple,
	...restStories
} = composedStories;

const mapStories = (stories: Partial<typeof composedStories>) =>
	Object.values(stories).map((Story: any) => [Story.storyName || 'Story', Story]);

// TODO: Fix select a11y violations
// "Interactive controls must not be nested (nested-interactive)"
// This is an issue in the component itself and not with the fields
const { WithSelect: _, ...accessibleStories } = composedStories;

const a11yTestCases = mapStories(accessibleStories);

const onlyInputs = mapStories(restStories);

const wrappedInputs = mapStories({
	WithCheckbox,
	WithRadioButton,
	WithToggleSwitch,
});

test.each(a11yTestCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test("Clicking WithTextArea's label should focus the textarea", async () => {
	render(<WithTextArea />);

	await userEvent.click(screen.getByText('Example', { exact: false }));

	expect(screen.getByRole('textbox')).toHaveFocus();
});

test.each(onlyInputs)("Clicking %s's label should focus the input", async (_storyname, Story) => {
	render(<Story />);

	const input = screen.getByLabelText('Example', { exact: false });
	await userEvent.click(screen.getByText('Example', { exact: false }));

	expect(input).toHaveFocus();
});

test.each(wrappedInputs)("Clicking %s's label should focus the input and mark it as checked", async (_storyname, Story) => {
	render(<Story />);

	const input = screen.getByLabelText('Example', { exact: false });
	await userEvent.click(screen.getByText('Example', { exact: false, selector: 'span' }));

	expect(input).toHaveFocus();
	expect(input).toBeChecked();
});
