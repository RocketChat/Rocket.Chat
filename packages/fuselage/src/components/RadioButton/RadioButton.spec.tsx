import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
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
	it('changes style of element as radio button is checked', () => {
		render(<Default />);
		const radioButton = screen.getByRole<HTMLInputElement>('radio');
		radioButton.click();
		expect(radioButton.checked).toEqual(true);
	});
	it('displays radio button with defaultChecked value correctly', () => {
		render(<Checked />);
		const radioButton = screen.getByRole<HTMLInputElement>('radio');
		expect(radioButton.defaultChecked).toEqual(true);
	});
	it('displays radio button disabled correctly', () => {
		render(<Disabled />);
		const radioButton = screen.getByRole<HTMLInputElement>('radio');
		expect(radioButton.disabled).toEqual(true);
	});
});
