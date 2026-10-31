import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, waitFor } from '@testing-library/react';

import ParentTeam from './ParentTeam';
import { createFakeRoom } from '../../../../../tests/mocks/data';

const forbidden = { success: false, error: 'You are not allowed to do this', errorType: 'error-forbidden' };
const badRequest = { success: false, error: 'Team not found', errorType: 'error-team-not-found' };

const renderParentTeam = (error: unknown) => {
	const teamInfo = jest.fn(async () => {
		throw error;
	});

	render(<ParentTeam room={createFakeRoom({ teamId: 'team-id' })} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/teams.info', teamInfo)
			.withEndpoint('GET', '/v1/users.listTeams', async () => ({ teams: [] }))
			.build(),
	});

	return { teamInfo };
};

describe('ParentTeam', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should not retry teams.info after a 403 refusal', async () => {
		const { teamInfo } = renderParentTeam(forbidden);

		await waitFor(() => expect(teamInfo).toHaveBeenCalledTimes(1));
		await act(() => jest.advanceTimersByTimeAsync(60_000));

		expect(teamInfo).toHaveBeenCalledTimes(1);
	});

	it('should retry teams.info after any other error', async () => {
		const { teamInfo } = renderParentTeam(badRequest);

		await act(() => jest.advanceTimersByTimeAsync(60_000));

		expect(teamInfo.mock.calls.length).toBeGreaterThan(1);
	});
});
