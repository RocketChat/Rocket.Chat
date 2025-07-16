/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './AppLogsFilter.stories';

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders AppLogsItem without crashing`, async (_storyname, Story) => {
	const view = render(<Story />, {
		wrapper: mockAppRoot().build(),
	});
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('AppLogsItem should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	/**
	 ** Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
	 **/
	const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });

	expect(results).toHaveNoViolations();
});

it('Should show filter button in contextual bar', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByRole('button', { name: 'Filters' })).toBeVisible();
});

it('Should not show instance, time, and severity filters', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.queryByRole('button', { name: 'Time' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Severity' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Instance' })).not.toBeInTheDocument();
});
