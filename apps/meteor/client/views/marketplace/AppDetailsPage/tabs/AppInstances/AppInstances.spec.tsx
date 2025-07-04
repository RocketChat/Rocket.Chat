/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './AppInstances.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders AppInstances without crashing`, async (_storyname, Story) => {
	const view = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(await screen.findByRole('table')).toBeInTheDocument();

	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('AppInstances should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	// Today we do not have exactly a pattern to handle menu cells that don't have a header
	const results = await axe(container, { rules: { 'empty-table-header': { enabled: false } } });
	expect(await screen.findByRole('table')).toBeInTheDocument();

	expect(results).toHaveNoViolations();
});
