import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import VirtualList from './VirtualList';

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
		estimateSize?: (index: number) => number;
		overscan?: number;
		onEndReached?: () => void | Promise<unknown>;
	}> = {},
) => render(<VirtualList items={items} totalCount={20} renderItem={(item) => <div>{item._id}</div>} {...props} />);

describe('VirtualList', () => {
	beforeEach(() => {
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
	});

	it('has no accessibility violations', async () => {
		const { container } = renderVirtualList();
		expect(await axe(container)).toHaveNoViolations();
	});

	it('calls onEndReached when scrolled near the bottom', () => {
		const onEndReached = jest.fn();

		renderVirtualList({ onEndReached });
		expect(onEndReached).not.toHaveBeenCalled();

		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('does not call onEndReached when all items are loaded', () => {
		const onEndReached = jest.fn();

		renderVirtualList({ onEndReached, totalCount: items.length });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).not.toHaveBeenCalled();
	});

	it('does not call onEndReached repeatedly for the same item count', () => {
		const onEndReached = jest.fn();

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});

	it('calls onEndReached after a same-size dataset reset', () => {
		const onEndReached = jest.fn();
		const { rerender } = renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		const resetItems = Array.from({ length: 10 }, (_, index) => ({ _id: `reset-${index}` }));
		rerender(<VirtualList items={resetItems} totalCount={20} renderItem={(item) => <div>{item._id}</div>} onEndReached={onEndReached} />);
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('passes overscan through to virtua buffer size', () => {
		renderVirtualList({ overscan: 25 });

		expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-buffer-size', '25');
	});

	it('allows onEndReached to retry after a failed load', async () => {
		const onEndReached = jest.fn().mockRejectedValue(new Error('failed to load more items'));

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		await Promise.resolve();

		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('allows onEndReached to retry after a synchronous throw', () => {
		const onEndReached = jest
			.fn()
			.mockImplementationOnce(() => {
				throw new Error('failed to load more items');
			})
			.mockImplementation(() => undefined);

		renderVirtualList({ onEndReached });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('virtual-list'));
		fireEvent.scroll(screen.getByTestId('virtual-list'));

		expect(onEndReached).toHaveBeenCalledTimes(2);
	});

	it('calls onEndReached when the viewport is underfilled', () => {
		const onEndReached = jest.fn();
		mockVirtualizerHandle.scrollSize = 200;

		renderVirtualList({ onEndReached });

		expect(onEndReached).toHaveBeenCalledTimes(1);
	});
});
