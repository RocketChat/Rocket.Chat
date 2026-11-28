import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Skeleton from './Skeleton';
import * as stories from './Skeleton.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test('aspectRatio shapes a placeholder whose height follows its width', () => {
	render(<Skeleton variant='rect' width='100%' aspectRatio='21 / 9' data-testid='skeleton' />);

	expect(screen.getByTestId('skeleton')).toHaveStyle({ width: '100%', aspectRatio: '21 / 9' });
});
