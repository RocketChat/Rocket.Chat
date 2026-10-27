import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './AppLogsFilter.stories';

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

jest.mock('@rocket.chat/fuselage-hooks', () => {
	const originalModule = jest.requireActual('@rocket.chat/fuselage-hooks');
	return {
		...originalModule,
		useBreakpoints: () => ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
	};
});

test.each(testCases)('AppLogsItem should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });
	// Audit the loaded filters, not their loading skeletons.
	await waitFor(() => expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument());

	/**
	 ** Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
	 **/
	const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });

	expect(results).toHaveNoViolations();
});

it('Instance select should have correct options', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	const select = screen.getByLabelText('Instance');

	await userEvent.click(select);

	expect(await screen.findByRole('option', { name: 'All' })).toBeVisible();
	expect(await screen.findByRole('option', { name: 'instance-1' })).toBeVisible();
	expect(await screen.findByRole('option', { name: 'instance-2' })).toBeVisible();
	expect(await screen.findByRole('option', { name: 'instance-3' })).toBeVisible();
});

it('Time select should open modal when custom time range is selected', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

	const select = screen.getByLabelText('Time');

	await userEvent.click(select);

	expect(await screen.findByRole('option', { name: 'Custom_time_range' })).toBeVisible();
	await userEvent.click(await screen.findByRole('option', { name: 'Custom_time_range' }));

	expect(screen.getByRole('dialog')).toBeVisible();
});
