import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useMessagesSent } from './useMessagesSent';

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
				messages: 15,
			},
			{
				day: 'Tuesday',
				messages: 10,
			},
			{
				day: 'Wednesday',
				messages: 5,
			},
			{
				day: 'Thursday',
				messages: 0,
			},
			{
				day: 'Friday',
				messages: 0,
			},
			{
				day: 'Saturday',
				messages: 0,
			},
			{
				day: 'Sunday',
				messages: 0,
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
	const { result } = renderHook(() => useMessagesSent({ period: 'this week', utc: true }), {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/engagement-dashboard/messages/messages-sent', () => expectedResult)
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
				messages: 15,
			},
			{
				day: 'Tuesday',
				messages: 10,
			},
			{
				day: 'Wednesday',
				messages: 5,
			},
			{
				day: 'Thursday',
				messages: 0,
			},
			{
				day: 'Friday',
				messages: 0,
			},
			{
				day: 'Saturday',
				messages: 0,
			},
			{
				day: 'Sunday',
				messages: 0,
			},
		],
		end: new Date('2025-05-14T02:59:59.000Z'),
		period: {
			count: 15,
			variation: 2,
		},
		start: new Date('2025-05-11T03:00:00.000Z'),
		success: true,
		yesterday: {
			count: 15,
			variation: 3,
		},
	};
	const { result } = renderHook(() => useMessagesSent({ period: 'this week', utc: false }), {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/engagement-dashboard/messages/messages-sent', () => expectedResult)
			.build(),
	});

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	if (!result.current.data) {
		throw new Error('Data is undefined');
	}
	expect(result.current.data).toEqual(expectedResult);
});
