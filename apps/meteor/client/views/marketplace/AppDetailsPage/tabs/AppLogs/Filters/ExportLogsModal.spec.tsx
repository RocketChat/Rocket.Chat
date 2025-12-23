import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './ExportLogsModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);
const onConfirm = jest.fn();
const { Default } = composeStories(stories);

afterEach(() => {
	jest.clearAllMocks();
});

test.each(testCases)(`renders without crashing`, async (_storyname, Story) => {
	const view = render(<Story />, {
		wrapper: mockAppRoot().build(),
	});
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('Should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);

	expect(results).toHaveNoViolations();
});

it('should send the correct payload to the endpoint', async () => {
	render(<Default onConfirm={onConfirm} />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
	await userEvent.click(screen.getByRole('button', { name: 'Download' }));
	expect(onConfirm).toHaveBeenCalledTimes(1);
	expect(onConfirm).toHaveBeenCalledWith('/api/apps/undefined/export-logs?count=2000&type=json');
});

it('should include instance filter in the payload to endpoint', async () => {
	render(
		<Default
			onConfirm={onConfirm}
			filterValues={{
				instance: '123',
			}}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
	await userEvent.click(screen.getByRole('button', { name: 'Download' }));
	expect(onConfirm).toHaveBeenCalledTimes(1);
	expect(onConfirm).toHaveBeenCalledWith('/api/apps/undefined/export-logs?instanceId=123&count=2000&type=json');
});
