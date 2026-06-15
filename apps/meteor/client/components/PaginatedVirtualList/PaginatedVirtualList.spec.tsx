import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';

import { mockVirtualizerHandle } from '../../../tests/mocks/client/virtua';
import PaginatedVirtualList from './PaginatedVirtualList';

jest.mock('virtua', () => require('../../../tests/mocks/client/virtua'));

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	CustomVirtuaScrollbars: require('../../../tests/mocks/client/CustomVirtuaScrollbars').MockCustomVirtuaScrollbars,
}));

const items = Array.from({ length: 10 }, (_, index) => ({ _id: `${index}` }));

type VirtualListTestItem = (typeof items)[number];

const renderVirtualList = (
	props: Partial<{
		items: VirtualListTestItem[];
		totalCount: number;
		renderItem: (item: VirtualListTestItem, index: number) => ReactNode;
		overscan?: number;
		onEndReached?: UseInfiniteQueryResult['fetchNextPage'];
	}> = {},
) => render(<PaginatedVirtualList items={items} totalCount={20} renderItem={(item) => <div>{item._id}</div>} {...props} />);

const advanceDebouncedScroll = async () => {
	await act(async () => {
		await jest.advanceTimersByTimeAsync(300);
	});
};

describe('PaginatedVirtualList', () => {
	beforeEach(() => {
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('has no accessibility violations', async () => {
		const { container } = renderVirtualList();
		expect(await axe(container)).toHaveNoViolations();
	});

	it('calls onEndReached when scrolled near the bottom', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockResolvedValue(undefined);

		renderVirtualList({ onEndReached });
		expect(onEndReached).not.toHaveBeenCalled();

		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('does not call onEndReached when all items are loaded', () => {
		const onEndReached = jest.fn().mockResolvedValue(undefined);

		renderVirtualList({ onEndReached, totalCount: items.length });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list'));

		expect(onEndReached).not.toHaveBeenCalled();
	});

	it('does not call onEndReached repeatedly for the same item count', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockResolvedValue(undefined);

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list'));
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('calls onEndReached after a same-size dataset reset', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockResolvedValue(undefined);
		const { rerender } = renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		const resetItems = Array.from({ length: 10 }, (_, index) => ({ _id: `reset-${index}` }));
		rerender(
			<PaginatedVirtualList items={resetItems} totalCount={20} renderItem={(item) => <div>{item._id}</div>} onEndReached={onEndReached} />,
		);
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('passes overscan through to virtua buffer size', () => {
		renderVirtualList({ overscan: 25 });

		expect(screen.getByRole('list')).toHaveAttribute('data-buffer-size', '25');
	});

	it('allows onEndReached to retry after a failed load', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockRejectedValue(new Error('failed to load more items'));

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('allows onEndReached to retry after a synchronous throw', async () => {
		jest.useFakeTimers();
		const onEndReached = jest
			.fn()
			.mockImplementationOnce(() => {
				throw new Error('failed to load more items');
			})
			.mockImplementation(() => undefined);

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();
		fireEvent.scroll(screen.getByRole('list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('calls onEndReached when the viewport is underfilled', () => {
		const onEndReached = jest.fn().mockResolvedValue(undefined);
		mockVirtualizerHandle.scrollSize = 200;

		renderVirtualList({ onEndReached });

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});
});
