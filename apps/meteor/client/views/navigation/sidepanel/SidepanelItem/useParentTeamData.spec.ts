import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useParentTeamData } from './useParentTeamData';

const forbidden = { success: false, error: 'You are not allowed to do this', errorType: 'error-forbidden' };
const badRequest = { success: false, error: 'Team not found', errorType: 'error-team-not-found' };

const renderParentTeamData = (error: unknown) => {
	const teamInfo = jest.fn(async () => {
		throw error;
	});

	const { result } = renderHook(() => useParentTeamData('team-id'), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/teams.info', teamInfo)
			.withEndpoint('GET', '/v1/users.listTeams', async () => ({ teams: [] }))
			.build(),
	});

	return { teamInfo, result };
};

describe('useParentTeamData', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should not retry teams.info after a 403 refusal', async () => {
		const { teamInfo, result } = renderParentTeamData(forbidden);

		await waitFor(() => expect(result.current.teamInfoError).toBe(true));
		await act(() => jest.advanceTimersByTimeAsync(60_000));

		expect(teamInfo).toHaveBeenCalledTimes(1);
	});

	it('should retry teams.info after any other error', async () => {
		const { teamInfo } = renderParentTeamData(badRequest);

		await act(() => jest.advanceTimersByTimeAsync(60_000));

		expect(teamInfo.mock.calls.length).toBeGreaterThan(1);
	});
});
