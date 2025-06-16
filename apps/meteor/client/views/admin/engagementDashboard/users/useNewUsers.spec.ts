import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useNewUsers } from './useNewUsers';

beforeAll(() => {
	jest.useFakeTimers().setSystemTime(new Date(2025, 4, 13));
});

afterAll(() => {
	jest.useRealTimers();
});

it('should return utc time', async () => {
	const expectedResult = {
		days: [
			{
				day: 'Monday',
				users: 15,
			},
			{
				day: 'Tuesday',
				users: 10,
			},
			{
				day: 'Wednesday',
				users: 5,
			},
			{
				day: 'Thursday',
				users: 0,
			},
			{
				day: 'Friday',
				users: 0,
			},
			{
				day: 'Saturday',
				users: 0,
			},
			{
				day: 'Sunday',
				users: 0,
			},
		],
		end: new Date('2025-05-13T23:59:59.999Z'),
		period: {
			count: 15,
			variation: 2,
		},
		start: new Date('2025-05-11T00:00:00.000Z'),
		success: true,
		yesterday: {
			count: 15,
			variation: 3,
		},
	};
	const { result } = renderHook(() => useNewUsers({ period: 'this week', utc: true }), {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/engagement-dashboard/users/new-users', () => expectedResult)
			.build(),
	});

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	if (!result.current.data) {
		throw new Error('Data is undefined');
	}
	expect(result.current.data).toEqual(expectedResult);
});

// CI is currently running in UTC, so no local time is returned
// TODO: find a way to simulate local time properly in tests
it.skip('should return local time', async () => {
	const expectedResult = {
		days: [
			{
				day: 'Monday',
				users: 15,
			},
			{
				day: 'Tuesday',
				users: 10,
			},
			{
				day: 'Wednesday',
				users: 5,
			},
			{
				day: 'Thursday',
				users: 0,
			},
			{
				day: 'Friday',
				users: 0,
			},
			{
				day: 'Saturday',
				users: 0,
			},
			{
				day: 'Sunday',
				users: 0,
			},
		],
		end: new Date('2025-05-13T23:59:59.999Z'),
		period: {
			count: 15,
			variation: 2,
		},
		start: new Date('2025-05-11T00:00:00.000Z'),
		success: true,
		yesterday: {
			count: 15,
			variation: 3,
		},
	};
	const { result } = renderHook(() => useNewUsers({ period: 'this week', utc: false }), {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/engagement-dashboard/users/new-users', () => expectedResult)
			.build(),
	});

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	if (!result.current.data) {
		throw new Error('Data is undefined');
	}
	expect(result.current.data).toEqual(expectedResult);
});
