import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './FeaturePreviewView.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const view = render(<Story />);
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	// Fuselage's StatesTitle always renders an h3, right below the page's h1.
	const results = await axe(container, { rules: { 'heading-order': { enabled: false } } });
	expect(results).toHaveNoViolations();
});
