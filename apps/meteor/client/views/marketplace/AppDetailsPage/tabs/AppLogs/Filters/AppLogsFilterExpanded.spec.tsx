import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
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

it('Instance select should have correct options', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	const select = screen.getByLabelText('Instance');

	await userEvent.click(select);

	expect(screen.getByRole('option', { name: 'All' })).toBeVisible();
	expect(screen.getByRole('option', { name: 'instance-1' })).toBeVisible();
	expect(screen.getByRole('option', { name: 'instance-2' })).toBeVisible();
	expect(screen.getByRole('option', { name: 'instance-3' })).toBeVisible();
});

it('Time select should open modal when custom time range is selected', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

	const select = screen.getByLabelText('Time');

	await userEvent.click(select);

	expect(screen.getByRole('option', { name: 'Custom_time_range' })).toBeVisible();
	await userEvent.click(screen.getByRole('option', { name: 'Custom_time_range' }));

	expect(screen.getByRole('dialog')).toBeVisible();
});
