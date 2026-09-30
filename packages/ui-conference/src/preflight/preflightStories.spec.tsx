import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as preflightDevices from './PreflightDevices.stories';

const testCases = Object.values(composeStories(preflightDevices)).map(
	(Story) => [`PreflightDevices ${Story.storyName || 'Story'}`, Story] as const,
);

describe('preflight stories', () => {
	// Played first: a story with a `play` is the state it leaves behind, such as an open menu.
	test.each(testCases)('renders %s without crashing', async (_storyname, Story) => {
		const { baseElement, container } = render(<Story />);
		await Story.play?.({ canvasElement: container });

		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);
		await Story.play?.({ canvasElement: container });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
