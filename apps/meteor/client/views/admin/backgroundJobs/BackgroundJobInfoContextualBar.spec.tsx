import type { CronJobStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import BackgroundJobInfoContextualBar from './BackgroundJobInfoContextualBar';

describe('BackgroundJobInfoContextualBar', () => {
	const mockJob = {
		_id: 'Test_Job',
		name: 'Test_Job',
		status: 'scheduled' as CronJobStatus,
		nextRunAt: '2025-01-01T00:00:00.000Z',
		lastFinishedAt: '2025-01-01T00:00:00.000Z',
		_updatedAt: '2025-01-01T00:00:00.000Z',
	};

	const buildMockRoot = () =>
		mockAppRoot()
			.withEndpoint('GET', '/v1/cron.job', () => ({ job: mockJob, success: true }))
			.withEndpoint('GET', '/v1/cron.history', () => ({ history: [], offset: 0, count: 0, total: 0, success: true }))
			.build();

	it('should render ContextualBar action buttons when tab is system', async () => {
		render(<BackgroundJobInfoContextualBar jobName='Test_Job' tab='system' onClose={jest.fn()} />, {
			wrapper: buildMockRoot(),
		});

		expect(await screen.findByText('Run_now')).toBeInTheDocument();
		expect(await screen.findByText('Disable')).toBeInTheDocument();
	});

	it('should NOT render ContextualBar action buttons when tab is apps', async () => {
		render(<BackgroundJobInfoContextualBar jobName='Test_Job' tab='apps' onClose={jest.fn()} />, {
			wrapper: buildMockRoot(),
		});

		expect(await screen.findByText('Test_Job')).toBeInTheDocument();

		expect(screen.queryByText('Run_now')).not.toBeInTheDocument();
		expect(screen.queryByText('Disable')).not.toBeInTheDocument();
	});

	it('should NOT render ContextualBar action buttons when tab is omnichannel', async () => {
		render(<BackgroundJobInfoContextualBar jobName='Test_Job' tab='omnichannel' onClose={jest.fn()} />, {
			wrapper: buildMockRoot(),
		});

		expect(await screen.findByText('Test_Job')).toBeInTheDocument();

		expect(screen.queryByText('Run_now')).not.toBeInTheDocument();
		expect(screen.queryByText('Disable')).not.toBeInTheDocument();
	});

	it('should render the Enable button when the job is disabled', async () => {
		const disabledJob = { ...mockJob, status: 'disabled' as CronJobStatus, disabled: true };
		const disabledMockRoot = mockAppRoot()
			.withEndpoint('GET', '/v1/cron.job', () => ({ job: disabledJob, success: true }))
			.withEndpoint('GET', '/v1/cron.history', () => ({ history: [], offset: 0, count: 0, total: 0, success: true }))
			.build();

		render(<BackgroundJobInfoContextualBar jobName='Test_Job' tab='system' onClose={jest.fn()} />, {
			wrapper: disabledMockRoot,
		});

		expect(await screen.findByText('Enable')).toBeInTheDocument();
		expect(screen.queryByText('Disable')).not.toBeInTheDocument();
	});
});
