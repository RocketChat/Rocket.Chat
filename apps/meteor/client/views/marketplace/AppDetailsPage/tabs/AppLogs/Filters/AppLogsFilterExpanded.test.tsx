import { it, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';

mock.module(require.resolve('@rocket.chat/fuselage-hooks'), {
	exports: {
		default: (() => {
			const originalModule = require('@rocket.chat/fuselage-hooks');
			return {
				...originalModule,
				useBreakpoints: () => ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
			};
		})(),
	},
});
const stories: typeof import('./AppLogsFilter.stories') = require('./AppLogsFilter.stories');

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

testCases.forEach(([_storyname, Story]) => {
	test(`renders AppLogsItem without crashing`, async (t) => {
		const view = render(<Story />, {
			wrapper: mockAppRoot().build(),
		});
		t.assert.snapshot(view.baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`AppLogsItem should have no a11y violations`, async () => {
		const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

		/**
		 ** Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
		 **/
		const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });

		expect(results).toHaveNoViolations();
	});
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
