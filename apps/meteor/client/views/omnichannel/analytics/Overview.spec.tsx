import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AgentOverview from './AgentOverview';
import Overview from './Overview';

const dateRange = { start: '2024-01-01', end: '2024-01-31' };

it('should render the overview counters returned by the server', async () => {
	const getOverview = jest.fn(() => [
		{ title: 'Total_conversations', value: 7 },
		{ title: 'Open_conversations', value: 3 },
	]);

	render(<Overview type='Conversations' dateRange={dateRange} departmentId='' />, {
		wrapper: mockAppRoot().withEndpoint('GET', '/v1/livechat/analytics/overview', getOverview).build(),
	});

	expect(await screen.findByText('Total_conversations')).toBeInTheDocument();
	expect(screen.getByText('7')).toBeInTheDocument();
	expect(getOverview).toHaveBeenCalledWith({ name: 'Conversations', from: dateRange.start, to: dateRange.end });
});

it('should not request the overview without a date range', () => {
	const getOverview = jest.fn(() => []);

	render(<Overview type='Conversations' dateRange={{ start: '', end: '' }} departmentId='' />, {
		wrapper: mockAppRoot().withEndpoint('GET', '/v1/livechat/analytics/overview', getOverview).build(),
	});

	expect(getOverview).not.toHaveBeenCalled();
});

it('should render the agent overview table returned by the server', async () => {
	render(<AgentOverview type='Total_conversations' dateRange={dateRange} departmentId='dep1' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/livechat/analytics/agent-overview', () => ({
				head: [{ name: 'Agent' }, { name: '%_of_conversations' }],
				data: [{ name: 'john.doe', value: 42 }],
			}))
			.build(),
	});

	expect(await screen.findByText('john.doe')).toBeInTheDocument();
	expect(screen.getByText('42')).toBeInTheDocument();
});
