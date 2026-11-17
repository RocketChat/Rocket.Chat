import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
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

	// The story decorator shares one modal context across tests, so leave no modal open behind
	await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
});

it('Time select should reopen the modal after a custom time range is applied', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByRole('combobox', { name: 'Time' }));
	await userEvent.click(await screen.findByRole('option', { name: 'Custom_time_range' }));

	const dialog = screen.getByRole('dialog');
	await userEvent.type(within(dialog).getByLabelText('Start_Date'), '2026-03-01');
	await userEvent.type(within(dialog).getByLabelText('End_Date'), '2026-03-05');
	await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));

	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	expect(screen.getByRole('combobox', { name: 'Time' })).toHaveTextContent('Mar 01, 2026 - Mar 05, 2026');

	await userEvent.click(screen.getByRole('combobox', { name: 'Time' }));
	await userEvent.click(await screen.findByRole('option', { name: 'Custom_time_range' }));

	expect(screen.getByRole('dialog')).toBeVisible();

	// The story decorator shares one modal context across tests, so leave no modal open behind
	await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
});

it('Time select should prefill the modal with the last custom time range after picking another option', async () => {
	render(<Default />, {
		wrapper: mockAppRoot().build(),
	});

	const openCustomTimeRange = async () => {
		await userEvent.click(screen.getByRole('combobox', { name: 'Time' }));
		await userEvent.click(await screen.findByRole('option', { name: 'Custom_time_range' }));
		return screen.getByRole('dialog');
	};

	const dialog = await openCustomTimeRange();
	await userEvent.type(within(dialog).getByLabelText('Start_Date'), '2026-03-01');
	await userEvent.type(within(dialog).getByLabelText('End_Date'), '2026-03-05');
	await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

	for await (const option of ['All_time', 'Today']) {
		await userEvent.click(screen.getByRole('combobox', { name: 'Time' }));
		await userEvent.click(await screen.findByRole('option', { name: option }));

		const reopened = await openCustomTimeRange();
		expect(within(reopened).getByLabelText('Start_Date')).toHaveValue('2026-03-01');
		expect(within(reopened).getByLabelText('End_Date')).toHaveValue('2026-03-05');
		await userEvent.click(within(reopened).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(screen.getByRole('combobox', { name: 'Time' })).toHaveTextContent(option);
	}
});
