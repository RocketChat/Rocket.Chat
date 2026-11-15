import { composeStories } from '@storybook/react-webpack5';
import { render } from '@testing-library/react';
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

const allTestCases = mapStories(composedStories);

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

test.each(allTestCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const tree = render(<Story />);
	expect(tree.baseElement).toMatchSnapshot();
});

test.each(a11yTestCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test("Clicking WithTextArea's label should focus the textarea", async () => {
	const { getByText, container } = render(<WithTextArea />);

	const textarea = container.querySelector('textarea');
	const label = getByText('Example', { exact: false });
	await userEvent.click(label);

	expect(textarea).toHaveFocus();
});

test.each(onlyInputs)("Clicking %s's label should focus the input", async (_storyname, Story) => {
	const { getByText, container } = render(<Story />);

	const input = container.querySelector('input');
	const label = getByText('Example', { exact: false });
	await userEvent.click(label);

	expect(input).toHaveFocus();
});

test.each(wrappedInputs)("Clicking %s's label should focus the input and mark it as checked", async (_storyname, Story) => {
	const { getByText, container } = render(<Story />);

	const input = container.querySelector('input');
	const label = getByText('Example', { exact: false, selector: 'span' });
	await userEvent.click(label);

	expect(input).toHaveFocus();
	expect(input?.checked).toBe(true);
});
