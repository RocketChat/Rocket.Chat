import { render, screen, waitFor } from '@testing-library/react';

import { messageParser } from '../surfaces';

let mockImportFails = true;

// The chart module is its own file so that the first import of it is the one that fails.
jest.mock('./DataVisualizationChart', () => {
	if (mockImportFails) {
		throw new Error('chunk failed to load');
	}

	return { __esModule: true, default: () => <div data-testid='chart' /> };
});

const block = {
	type: 'data_visualization',
	title: 'Sales',
	chart: { type: 'pie', segments: [{ label: 'Web', value: 1 }] },
} as never;

it('shows the table and logs when the chart code fails to load, and tries again for the next chart', async () => {
	const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	const { unmount } = render(<>{messageParser.render([block])}</>);

	await waitFor(() => expect(logged).toHaveBeenCalledWith('The data_visualization chart failed', expect.any(Error)));
	expect(screen.getByRole('table', { name: 'Sales' })).toBeVisible();
	expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
	unmount();

	mockImportFails = false;
	render(<>{messageParser.render([block])}</>);

	expect(await screen.findByTestId('chart')).toBeInTheDocument();
	logged.mockRestore();
});
