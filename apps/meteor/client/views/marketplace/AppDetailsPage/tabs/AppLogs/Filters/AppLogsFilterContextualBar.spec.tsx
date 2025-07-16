/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './AppLogsFilterContextualBar.stories';

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

// UserEvents will throw a timeout without the advanceTimers option
jest.useFakeTimers({ advanceTimers: true });
jest.setSystemTime(new Date('2017-05-19T12:20:00'));

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

it('Time select should not have custom time range', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	const select = screen.getByLabelText('Time');

	await userEvent.click(select);

	expect(screen.queryByRole('option', { name: 'Custom_time_range' })).not.toBeInTheDocument();
});

const defaultTimeRangesAndValues = [
	{ name: 'Last_5_minutes', value: ['2017-05-19', '2017-05-19', '12:15', '12:20'] },
	{ name: 'Last_15_minutes', value: ['2017-05-19', '2017-05-19', '12:05', '12:20'] },
	{ name: 'Last_30_minutes', value: ['2017-05-19', '2017-05-19', '11:50', '12:20'] },
	{ name: 'Last_1_hour', value: ['2017-05-19', '2017-05-19', '11:20', '12:20'] },
	{ name: 'This_week', value: ['2017-05-14', '2017-05-20', '00:00', '23:59'] },
];

describe('Time range', () => {
	defaultTimeRangesAndValues.forEach(({ name, value }) => {
		it(`Should update time range when ${name} is selected`, async () => {
			render(<Default />, { wrapper: mockAppRoot().build() });

			const startDate = screen.getByLabelText('Start Date');
			const endDate = screen.getByLabelText('End Date');
			const startTime = screen.getByLabelText('Start Time');
			const endTime = screen.getByLabelText('End Time');
			const timeSelect = screen.getByLabelText('Time');

			await userEvent.click(timeSelect);

			expect(screen.getByRole('option', { name })).toBeVisible();
			await userEvent.click(screen.getByRole('option', { name }));

			expect(startDate).toHaveValue(value[0]);
			expect(endDate).toHaveValue(value[1]);
			expect(startTime).toHaveValue(value[2]);
			expect(endTime).toHaveValue(value[3]);
		});
	});

	defaultTimeRangesAndValues.forEach(({ name, value }) => {
		it(`Should manually set ${name}`, async () => {
			render(<Default />, { wrapper: mockAppRoot().build() });

			const startDate = screen.getByLabelText('Start Date');
			const endDate = screen.getByLabelText('End Date');
			const startTime = screen.getByLabelText('Start Time');
			const endTime = screen.getByLabelText('End Time');

			await userEvent.type(startDate, value[0]);
			await userEvent.type(endDate, value[1]);
			await userEvent.type(startTime, value[2]);
			await userEvent.type(endTime, value[3]);

			expect(startDate).toHaveValue(value[0]);
			expect(endDate).toHaveValue(value[1]);
			expect(startTime).toHaveValue(value[2]);
			expect(endTime).toHaveValue(value[3]);
		});
	});
});
