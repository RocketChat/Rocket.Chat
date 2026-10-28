import { composeStories } from '@storybook/react-vite';
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
		const { getByText } = render(<Tag pill>john.doe</Tag>);
		const tag = getByText('john.doe').parentElement;

		expect(tag).toHaveClass('rcx-tag', 'rcx-tag--pill');
	});

	test('does not apply the pill modifier by default', () => {
		const { getByText } = render(<Tag>john.doe</Tag>);
		const tag = getByText('john.doe').parentElement;

		expect(tag).toHaveClass('rcx-tag');
		expect(tag).not.toHaveClass('rcx-tag--pill');
	});
});
