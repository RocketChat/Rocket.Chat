import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Tag from './Tag';
import * as stories from './Tag.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Tag Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('applies the pill modifier when pill is set', () => {
		render(
			<Tag pill data-testid='tag'>
				john.doe
			</Tag>,
		);
		const tag = screen.getByTestId('tag');

		expect(tag).toHaveClass('rcx-tag', 'rcx-tag--pill');
	});

	test('does not apply the pill modifier by default', () => {
		render(<Tag data-testid='tag'>john.doe</Tag>);
		const tag = screen.getByTestId('tag');

		expect(tag).toHaveClass('rcx-tag');
		expect(tag).not.toHaveClass('rcx-tag--pill');
	});
});
