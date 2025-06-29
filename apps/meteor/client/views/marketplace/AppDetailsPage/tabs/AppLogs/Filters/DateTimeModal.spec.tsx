/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './DateTimeModal.stories';

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

	const results = await axe(container);

	expect(results).toHaveNoViolations();
});

it('should not enable apply button when start Date and end Date are not selected', async () => {
	render(<Default />, { wrapper: mockAppRoot().build() });
	const startDate = screen.getByLabelText('Start Date');
	const endDate = screen.getByLabelText('End Date');
	const startTime = screen.getByLabelText('Start Time');
	const endTime = screen.getByLabelText('End Time');

	expect(startDate).toBeInTheDocument();
	expect(endDate).toBeInTheDocument();
	expect(startTime).toBeInTheDocument();
	expect(endTime).toBeInTheDocument();

	await userEvent.type(startTime, '00:00');
	await userEvent.type(endTime, '00:00');

	const button = screen.getByRole('button', { name: 'Apply' });
	expect(button).toBeDisabled();

	await userEvent.type(startDate, '2022-01-01');
	await userEvent.type(endDate, '2022-01-02');
	expect(button).toBeEnabled();
});
