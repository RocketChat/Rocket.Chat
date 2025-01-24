import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import moment from 'moment';

import { useHourlyChatActivity } from './useHourlyChatActivity';

it('should return utc time', async () => {
	const expectedResult = {
		hours: [
			{ hour: 0, users: 0 },
			{ hour: 2, users: 0 },
			{ hour: 4, users: 0 },
			{ hour: 6, users: 0 },
			{ hour: 8, users: 0 },
			{ hour: 10, users: 0 },
			{ hour: 12, users: 5 },
			{ hour: 14, users: 0 },
			{ hour: 16, users: 0 },
			{ hour: 18, users: 0 },
			{ hour: 20, users: 0 },
			{ hour: 22, users: 0 },
		],
		success: true,
	};
	const { result } = renderHook(() => useHourlyChatActivity({ displacement: 0, utc: true }), {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/engagement-dashboard/users/chat-busier/hourly-data', () => expectedResult)
			.withJohnDoe()
			.withPermission('can-audit')
			.withPermission('can-audit-log')
			.build(),
	});

	await waitFor(() => expect(result.current.data?.hours).toEqual(expectedResult.hours));
});

it('should return local time', async () => {
	const receivedData = {
		hours: [
			{ hour: 0, users: 0 },
			{ hour: 2, users: 0 },
			{ hour: 4, users: 0 },
			{ hour: 6, users: 0 },
			{ hour: 8, users: 0 },
			{ hour: 10, users: 0 },
			{ hour: 12, users: 5 },
			{ hour: 14, users: 0 },
			{ hour: 16, users: 0 },
			{ hour: 18, users: 0 },
			{ hour: 20, users: 0 },
			{ hour: 22, users: 0 },
		],
		success: true,
	};

	const expectedResult = {
		hours: receivedData.hours.map((hours) => {
			return {
				hour: moment(moment.utc().set({ hour: hours.hour, minute: 0, second: 0 }).toISOString()).hour(),
				users: hours.users,
			};
		}),
	};
	const { result } = renderHook(() => useHourlyChatActivity({ displacement: 0, utc: false }), {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/engagement-dashboard/users/chat-busier/hourly-data', () => receivedData)
			.withJohnDoe()
			.withPermission('can-audit')
			.withPermission('can-audit-log')
			.build(),
	});

	await waitFor(() => expect(result.current.data?.hours).toEqual(expectedResult.hours));
});
