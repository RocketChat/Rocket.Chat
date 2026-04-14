import type { IOmnichannelBusinessUnit, Serialized } from '@rocket.chat/core-typings';
import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useUnitsList } from './useUnitsList';
import { createFakeBusinessUnit } from '../../../../tests/mocks/data';

const formatUnitItem = (u: Serialized<IOmnichannelBusinessUnit>) => ({
	_id: u._id,
	label: u.name,
	value: u._id,
});

const mockGetUnits = jest.fn();

const appRoot = new MockedAppRootBuilder().withEndpoint('GET', '/v1/livechat/units', mockGetUnits);

afterEach(() => {
	jest.clearAllMocks();
});

it('should fetch business units', async () => {
	const limit = 5;

	const data = Array.from({ length: 10 }, () => createFakeBusinessUnit());

	mockGetUnits.mockImplementation(({ offset, count }: { offset: number; count: number }) => {
		const units = data.slice(offset, offset + count);

		return {
			units,
			count,
			offset,
			total: data.length,
		};
	});

	const { result } = renderHook(() => useUnitsList({ filter: '', limit }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(data.slice(0, 5).map(formatUnitItem)));

	await act(() => result.current.fetchNextPage());

	await waitFor(() => expect(result.current.data).toEqual(data.map(formatUnitItem)));

	await act(() => result.current.fetchNextPage());

	// should not fetch again since total was reached
	expect(mockGetUnits).toHaveBeenCalledTimes(2);
});
