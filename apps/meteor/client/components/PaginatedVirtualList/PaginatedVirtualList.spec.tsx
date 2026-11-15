import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import PaginatedVirtualList from './PaginatedVirtualList';

const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	scrollTo: jest.fn(),
	findItemIndex: jest.fn((offset: number) => offset),
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
};

type MockVListProps = {
	children: ReactNode;
	bufferSize?: number;
	onScroll?: (offset: number) => void;
	as?: React.ElementType;
	item?: React.ElementType;
	style?: CSSProperties;
	className?: string;
};

jest.mock('virtua', () => {
	return {
		Virtualizer: React.forwardRef(
			(
				{ children, bufferSize, onScroll, as: asRoot = 'div', item: asItem = 'div', style, className }: MockVListProps,
				ref: React.Ref<unknown>,
			) => {
				React.useImperativeHandle(ref, () => mockVirtualizerHandle);
				const Root = asRoot;
				const Item = asItem;
				const wrapped = Children.map(children, (child, index) => {
					const key = isValidElement(child) && child.key != null ? String(child.key) : `row-${index}`;
					return <Item key={key}>{child}</Item>;
				});

				return (
					<Root
						className={className}
						data-buffer-size={bufferSize}
						data-testid='virtual-list'
						style={style ?? { height: '100%' }}
						onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)}
					>
						{wrapped}
					</Root>
				);
			},
		),
	};
});

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	CustomVirtuaScrollbars: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CustomVirtuaScrollbars(
		{ children, ...props },
		ref,
	) {
		// eslint-disable-next-line testing-library/no-node-access
		const content = isValidElement<{ children?: ReactNode }>(children) && children.type === 'div' ? children.props.children : children;

		return (
			<div ref={ref} {...props}>
				{content}
			</div>
		);
	}),
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
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('does not call onEndReached when all items are loaded', () => {
		const onEndReached = jest.fn().mockResolvedValue(undefined);

		renderVirtualList({ onEndReached, totalCount: items.length });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).not.toHaveBeenCalled();
	});

	it('does not call onEndReached repeatedly for the same item count', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockResolvedValue(undefined);

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('calls onEndReached after a same-size dataset reset', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockResolvedValue(undefined);
		const { rerender } = renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await advanceDebouncedScroll();

		const resetItems = Array.from({ length: 10 }, (_, index) => ({ _id: `reset-${index}` }));
		rerender(
			<PaginatedVirtualList items={resetItems} totalCount={20} renderItem={(item) => <div>{item._id}</div>} onEndReached={onEndReached} />,
		);
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await advanceDebouncedScroll();

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('passes overscan through to virtua buffer size', () => {
		renderVirtualList({ overscan: 25 });

		expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-buffer-size', '25');
	});

	it('allows onEndReached to retry after a failed load', async () => {
		jest.useFakeTimers();
		const onEndReached = jest.fn().mockRejectedValue(new Error('failed to load more items'));

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await advanceDebouncedScroll();

		fireEvent.scroll(screen.getByTestId('virtual-list'));
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
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await advanceDebouncedScroll();
		fireEvent.scroll(screen.getByTestId('virtual-list'));
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
