import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import Avatar from './Avatar';
import * as stories from './Avatar.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Avatar Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('uses `url` over a native `src` prop', () => {
		const { container } = render(<Avatar url='https://example.com/a.png' src='https://example.com/b.png' />);

		expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
	});
});
