import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import RoomFiles from './RoomFiles';
import * as stories from './RoomFiles.stories';

jest.mock('../../../../../app/utils/client', () => ({
	getURL: jest.fn((url: string) => url),
}));

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

const composed = composeStories(stories);
const testCases = Object.values(composed).map((Story) => [Story.storyName || 'Story', Story]);
const appRoot = mockAppRoot().build();
const uploadedAt = new Date('2024-01-01T00:00:00.000Z');

const fileItems = Array.from({ length: 10 }, (_, i) => ({
	_id: String(i),
	name: `File ${i}`,
	url: '#',
	uploadedAt,
	user: {
		_id: 'rocket.cat',
		username: 'rocket.cat',
	},
	_updatedAt: uploadedAt,
})) as React.ComponentProps<typeof RoomFiles>['filesItems'];

const renderRoomFiles = (props: Partial<React.ComponentProps<typeof RoomFiles>> = {}) =>
	render(
		<RoomFiles
			rid='room-id'
			isPending={false}
			isSuccess
			type='all'
			text=''
			filesItems={fileItems}
			loadMoreItems={jest.fn() as React.ComponentProps<typeof RoomFiles>['loadMoreItems']}
			setType={jest.fn()}
			setText={jest.fn()}
			total={20}
			onClickClose={jest.fn()}
			onClickDelete={jest.fn()}
			{...props}
		/>,
		{ wrapper: appRoot },
	);

const advanceDebouncedScroll = async () => {
	await act(async () => {
		await jest.advanceTimersByTimeAsync(300);
	});
};

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: appRoot });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: appRoot });

	// Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
	const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });
	expect(results).toHaveNoViolations();
});

describe('RoomFiles virtualized list', () => {
	beforeEach(() => {
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renders file rows inside the named Virtua list', () => {
		renderRoomFiles({ total: fileItems.length });

		const list = screen.getByRole('list', { name: 'Files_list' });
		expect(list.tagName.toLowerCase()).toBe('ul');
		expect(list).toHaveAttribute('data-buffer-size', '100');
		expect(within(list).getAllByRole('listitem')).toHaveLength(10);
		expect(within(list).getByText('File 0')).toBeInTheDocument();
		expect(within(list).getAllByRole('button', { name: 'More' })).toHaveLength(10);
	});

	it('does not render the virtual list for loading or empty states', () => {
		const { unmount } = renderRoomFiles({ isPending: true, isSuccess: false, filesItems: [], total: 0 });
		expect(screen.queryByRole('list', { name: 'Files_list' })).not.toBeInTheDocument();
		unmount();

		renderRoomFiles({ filesItems: [], total: 0 });
		expect(screen.queryByRole('list', { name: 'Files_list' })).not.toBeInTheDocument();
		expect(screen.getByText('No_files_found')).toBeInTheDocument();
	});

	it('calls loadMoreItems when scrolled near the bottom', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockResolvedValue(undefined) as React.ComponentProps<typeof RoomFiles>['loadMoreItems'];

		renderRoomFiles({ loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByRole('list', { name: 'Files_list' }));
		await advanceDebouncedScroll();

		expect(loadMoreItems).toHaveBeenCalledTimes(1);
	});
});
