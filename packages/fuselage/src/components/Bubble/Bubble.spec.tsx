import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Bubble from './Bubble';
import * as stories from './Bubble.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Bubble Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[Bubble className]', () => {
	test('keeps its own classes next to a consumer className', () => {
		render(
			<Bubble className='custom' contentProps={{ className: 'content' }} onClick={() => undefined} data-testid='bubble'>
				Label
			</Bubble>,
		);

		expect(screen.getByTestId('bubble')).toHaveClass('rcx-bubble', 'custom');
		expect(screen.getByRole('button', { name: 'Label' })).toHaveClass('rcx-bubble__button', 'content');
	});
});
