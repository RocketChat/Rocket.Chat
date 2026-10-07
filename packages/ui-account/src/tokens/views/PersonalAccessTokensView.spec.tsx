import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './PersonalAccessTokensView.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const view = render(<Story />);
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	// The actions column has no header text by design, like the other admin tables.
	const results = await axe(container, { rules: { 'empty-table-header': { enabled: false } } });
	expect(results).toHaveNoViolations();
});
