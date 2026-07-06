/* eslint-disable testing-library/no-node-access */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import TeamsChannels from './TeamsChannels';
import { createFakeRoom } from '../../../../../tests/mocks/data';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRouteLink: () => undefined,
		getRoomName: (_type: string, room: { name?: string }) => room.name,
	},
}));

const mockVirtualizerHandle = {
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
};

type MockVirtualizerProps = {
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
				{ children, bufferSize, onScroll, as: asRoot = 'div', item: asItem = 'div', style, className }: MockVirtualizerProps,
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
						data-testid='teams-channels-virtual-list'
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

const mainRoom = createFakeRoom({ name: 'Main Room' });
const fakeRooms = Array.from({ length: 10 }, (_, index) => createFakeRoom({ t: 'c', name: `Fake Room ${index}` }));

const createLoadMoreItems = () =>
	jest.fn(async () => {
		return {} as Awaited<ReturnType<UseInfiniteQueryResult['fetchNextPage']>>;
	}) satisfies jest.MockedFunction<UseInfiniteQueryResult['fetchNextPage']>;

const advanceDebouncedScroll = async () => {
	await act(async () => {
		await jest.advanceTimersByTimeAsync(300);
	});
};

beforeEach(() => {
	mockVirtualizerHandle.scrollOffset = 0;
	mockVirtualizerHandle.scrollSize = 1000;
	mockVirtualizerHandle.viewportSize = 300;

	Object.defineProperty(window, 'getComputedStyle', {
		value: () => {
			return {
				getPropertyPriority: () => undefined,
				getPropertyValue: () => undefined,
			};
		},
	});
});

afterEach(() => {
	jest.useRealTimers();
});

it('renders channels inside the paginated virtual list', () => {
	render(
		<TeamsChannels
			text=''
			type='all'
			reload={() => undefined}
			loadMoreItems={createLoadMoreItems()}
			setText={() => undefined}
			setType={() => undefined}
			onClickClose={() => undefined}
			onClickAddExisting={() => undefined}
			onClickView={() => undefined}
			onClickCreateNew={() => undefined}
			total={fakeRooms.length}
			loading={false}
			mainRoom={mainRoom}
			channels={fakeRooms}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	const list = screen.getByTestId('teams-channels-virtual-list');

	expect(list.tagName.toLowerCase()).toBe('ul');
	expect(within(list).getAllByRole('listitem')).toHaveLength(fakeRooms.length);
	expect(within(list).getByText('Fake Room 0')).toBeInTheDocument();
});

it('wires end reached to load more items', async () => {
	jest.useFakeTimers();
	const loadMoreItems = createLoadMoreItems();

	render(
		<TeamsChannels
			text=''
			type='all'
			reload={() => undefined}
			loadMoreItems={loadMoreItems}
			setText={() => undefined}
			setType={() => undefined}
			onClickClose={() => undefined}
			onClickAddExisting={() => undefined}
			onClickView={() => undefined}
			onClickCreateNew={() => undefined}
			total={fakeRooms.length + 1}
			loading={false}
			mainRoom={mainRoom}
			channels={fakeRooms}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);
	expect(loadMoreItems).not.toHaveBeenCalled();

	mockVirtualizerHandle.scrollOffset = 700;
	fireEvent.scroll(screen.getByTestId('teams-channels-virtual-list'));
	await advanceDebouncedScroll();

	expect(loadMoreItems).toHaveBeenCalledTimes(1);
});
