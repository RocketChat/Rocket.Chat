import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { Children, createElement, forwardRef } from 'react';
import type { CustomContainerComponentProps } from 'virtua';

import SidebarVirtualList from './SidebarVirtualList';
import type { SidebarVirtualListGroup } from './SidebarVirtualList';

let mockVisibleIndexes: number[] | undefined;

type MockVirtualizerProps = {
	children: ReactNode | ((item: unknown, index: number) => ReactNode);
	data?: ArrayLike<unknown>;
	bufferSize?: number;
	as?: ElementType;
	style?: CSSProperties;
	className?: string;
};

jest.mock('virtua', () => {
	return {
		Virtualizer({ children, data, bufferSize, as: root = 'div', style, className }: MockVirtualizerProps) {
			const visibleIndexes = new Set(mockVisibleIndexes ?? Array.from({ length: data?.length ?? 0 }, (_, index) => index));

			const childrenToRender =
				typeof children === 'function'
					? [...visibleIndexes].sort((a, b) => a - b).map((index) => children(data?.[index], index))
					: Children.toArray(children).filter((_, index) => visibleIndexes.has(index));

			return createElement(
				root,
				{
					className,
					'data-buffer-size': bufferSize,
					'data-testid': 'virtual-list',
					'style': style ?? { height: '100%' },
				},
				childrenToRender,
			);
		},
	};
});

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	CustomVirtuaScrollbars: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CustomVirtuaScrollbars(
		{ children, ...props },
		ref,
	) {
		return (
			<div ref={ref} {...props}>
				{children}
			</div>
		);
	}),
}));

type TestGroup = {
	title: string;
};

type TestItem = {
	_id: string;
	name: string;
};

const groups: SidebarVirtualListGroup<TestGroup, TestItem>[] = [
	{
		key: 'channels',
		group: { title: 'Channels' },
		items: [
			{ _id: 'general', name: 'general' },
			{ _id: 'support', name: 'support' },
		],
	},
	{
		key: 'direct',
		group: { title: 'Direct Messages' },
		items: [{ _id: 'alice', name: 'alice' }],
	},
];

const defaultProps = {
	groups,
	getItemKey: (item: TestItem) => item._id,
	renderGroup: (group: TestGroup, groupIndex: number) => <div data-testid='virtual-row'>{`group:${groupIndex}:${group.title}`}</div>,
	renderItem: (item: TestItem, itemIndex: number, group: TestGroup, groupIndex: number, rowIndex: number) => (
		<div data-testid='virtual-row'>{`item:${groupIndex}:${itemIndex}:${rowIndex}:${group.title}:${item.name}`}</div>
	),
};

const renderVirtualList = (
	props: Partial<{
		groups: SidebarVirtualListGroup<TestGroup, TestItem>[];
		bufferSize: number;
		as: ElementType;
		renderGroup: typeof defaultProps.renderGroup;
		renderItem: typeof defaultProps.renderItem;
	}> = {},
) => render(<SidebarVirtualList {...defaultProps} {...props} />);

describe('SidebarVirtualList', () => {
	beforeEach(() => {
		mockVisibleIndexes = undefined;
	});

	it('renders group rows and item rows in order', () => {
		renderVirtualList();

		expect(screen.getAllByTestId('virtual-row').map((row) => row.textContent)).toEqual([
			'group:0:Channels',
			'item:0:0:1:Channels:general',
			'item:0:1:2:Channels:support',
			'group:1:Direct Messages',
			'item:1:0:4:Direct Messages:alice',
		]);
	});

	it('renders a group with no items', () => {
		renderVirtualList({
			groups: [
				{
					key: 'empty',
					group: { title: 'Empty Group' },
					items: [],
				},
			],
		});

		expect(screen.getAllByTestId('virtual-row').map((row) => row.textContent)).toEqual(['group:0:Empty Group']);
	});

	it('defers item rendering until Virtua requests the row', () => {
		mockVisibleIndexes = [0];

		const renderGroup = jest.fn((group: TestGroup) => <div data-testid='virtual-row'>{group.title}</div>);
		const renderItem = jest.fn((item: TestItem) => <div data-testid='virtual-row'>{item.name}</div>);

		renderVirtualList({
			groups: [
				{
					key: 'channels',
					group: { title: 'Channels' },
					items: Array.from({ length: 1000 }, (_, index) => ({ _id: `room-${index}`, name: `room-${index}` })),
				},
			],
			renderGroup,
			renderItem,
		});

		expect(renderGroup).toHaveBeenCalledTimes(1);
		expect(renderItem).not.toHaveBeenCalled();
		expect(screen.getByTestId('virtual-row')).toHaveTextContent('Channels');
	});

	it('passes bufferSize to Virtua', () => {
		renderVirtualList({ bufferSize: 25 });

		expect(screen.getByTestId('virtual-list')).toHaveAttribute('data-buffer-size', '25');
	});

	it('uses the caller-provided list container', () => {
		const ListContainer = forwardRef<HTMLDivElement, CustomContainerComponentProps>(function ListContainer({ children, style }, ref) {
			return (
				<div ref={ref} role='list' data-testid='custom-list' style={style}>
					{children}
				</div>
			);
		});

		renderVirtualList({ as: ListContainer });

		expect(screen.getByTestId('custom-list')).toHaveAttribute('role', 'list');
		expect(screen.getByTestId('custom-list')).toHaveTextContent('group:0:Channels');
	});

	it('has no accessibility violations for an accessible caller-provided list', async () => {
		const ListContainer = forwardRef<HTMLDivElement, CustomContainerComponentProps>(function ListContainer({ children, style }, ref) {
			return (
				<div ref={ref} role='list' aria-label='Channels' style={style}>
					{children}
				</div>
			);
		});

		const { container } = render(
			<SidebarVirtualList
				groups={groups}
				as={ListContainer}
				getItemKey={(item) => item._id}
				renderGroup={(group) => (
					<div role='listitem'>
						<button type='button'>{group.title}</button>
					</div>
				)}
				renderItem={(item) => <div role='listitem'>{item.name}</div>}
			/>,
		);

		expect(await axe(container)).toHaveNoViolations();
	});
});
