import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './Modal.stories';
import { render } from '../../testing';

const composedStories = composeStories(stories);

const { Default } = composedStories;

const testCases = Object.values(composedStories).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Modal Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('Default should render the dialog a11y compliant', () => {
		render(<Default />);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
