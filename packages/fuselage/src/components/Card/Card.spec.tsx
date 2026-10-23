import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import { CardHeader } from '.';
import * as stories from './Card.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Card Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	describe('className handling', () => {
		it('preserves default classes on CardHeader when className is passed', () => {
			const { container } = render(<CardHeader className='custom-header'>Header</CardHeader>);
			expect(container.firstElementChild).toHaveClass('rcx-card__header');
			expect(container.firstElementChild).toHaveClass('custom-header');
		});
	});
});
