import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './MessageAction.stories';

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
