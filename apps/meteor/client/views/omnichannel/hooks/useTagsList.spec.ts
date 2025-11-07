import type { ILivechatTag, Serialized } from '@rocket.chat/core-typings';
import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import type { TagListItem } from './useTagsList';
import { useTagsList } from './useTagsList';
import { createFakeTag } from '../../../../tests/mocks/data';

const formatTagItem = (tag: Serialized<ILivechatTag>): TagListItem => ({
	_id: tag._id,
	label: tag.name,
	value: tag.name,
});

const mockGetTags = jest.fn();

const appRoot = new MockedAppRootBuilder().withEndpoint('GET', '/v1/livechat/tags', mockGetTags);

afterEach(() => {
	jest.clearAllMocks();
});

it('should fetch tags', async () => {
	const limit = 5;

	const data = Array.from({ length: 10 }, () => createFakeTag());

	mockGetTags.mockImplementation(({ offset, count }: { offset: number; count: number }) => {
		const tags = data.slice(offset, offset + count);

		return {
			tags,
			count,
			offset,
			total: data.length,
		};
	});

	const { result } = renderHook(() => useTagsList({ filter: '', limit }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(data.slice(0, 5).map(formatTagItem)));

	await act(() => result.current.fetchNextPage());

	await waitFor(() => expect(result.current.data).toEqual(data.map(formatTagItem)));

	await act(() => result.current.fetchNextPage());

	// should not fetch again since total was reached
	expect(mockGetTags).toHaveBeenCalledTimes(2);
});
