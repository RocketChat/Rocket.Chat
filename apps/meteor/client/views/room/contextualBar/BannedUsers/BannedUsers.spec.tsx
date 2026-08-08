import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, CSSProperties, ElementType, ReactNode, Ref } from 'react';
import { Children, forwardRef, isValidElement, useImperativeHandle } from 'react';

import BannedUsers from './BannedUsers';
import * as stories from './BannedUsers.stories';

const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	scrollTo: jest.fn(),
	findItemIndex: jest.fn((offset: number) => offset),
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
};
let mockVirtualizerHasHandle = true;

type MockVListProps = {
	children: ReactNode;
	bufferSize?: number;
	onScroll?: (offset: number) => void;
	as?: ElementType;
	item?: ElementType;
	style?: CSSProperties;
	className?: string;
};

jest.mock('virtua', () => {
	return {
		Virtualizer: forwardRef(
			(
				{ children, bufferSize, onScroll, as: asRoot = 'div', item: asItem = 'div', style, className }: MockVListProps,
				ref: Ref<unknown>,
			) => {
				useImperativeHandle(ref, () => (mockVirtualizerHasHandle ? mockVirtualizerHandle : null));
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
						data-testid='banned-users-virtual-list'
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

const composed = composeStories(stories);
const testCases = Object.values(composed).map((Story) => [Story.storyName || 'Story', Story] as const);

const appRoot = mockAppRoot().build();

const bannedUsers = [
	{
		_id: 'user1',
		username: 'john.doe',
		name: 'John Doe',
	},
	{
		_id: 'user2',
		username: '@jane.smith:matrix.org',
		name: 'Jane Smith',
	},
	{
		_id: 'user3',
		username: 'rocket.cat',
		name: 'Rocket.Cat',
	},
];

const renderBannedUsers = (props: Partial<ComponentProps<typeof BannedUsers>> = {}) =>
	render(
		<BannedUsers
			loading={false}
			bannedUsers={bannedUsers}
			onClickClose={jest.fn()}
			onClickUnban={jest.fn()}
			onLoadMore={jest.fn()}
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

describe('BannedUsers', () => {
	beforeEach(() => {
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
		mockVirtualizerHasHandle = true;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('calls onLoadMore when scrolled near the bottom', async () => {
		jest.useFakeTimers();
		const onLoadMore = jest.fn();

		renderBannedUsers({ onLoadMore });
		expect(onLoadMore).not.toHaveBeenCalled();

		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('banned-users-virtual-list'));
		await advanceDebouncedScroll();

		expect(onLoadMore).toHaveBeenCalledTimes(1);
	});

	it('does not call onLoadMore repeatedly for the same users', async () => {
		jest.useFakeTimers();
		const onLoadMore = jest.fn();

		renderBannedUsers({ onLoadMore });

		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('banned-users-virtual-list'));
		await advanceDebouncedScroll();
		fireEvent.scroll(screen.getByTestId('banned-users-virtual-list'));
		await advanceDebouncedScroll();

		expect(onLoadMore).toHaveBeenCalledTimes(1);
	});

	it('does not call onLoadMore again when only the callback identity changes', async () => {
		jest.useFakeTimers();
		const onLoadMore = jest.fn();
		const nextOnLoadMore = jest.fn();
		const { rerender } = renderBannedUsers({ onLoadMore });

		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('banned-users-virtual-list'));
		await advanceDebouncedScroll();

		rerender(
			<BannedUsers
				loading={false}
				bannedUsers={bannedUsers}
				onClickClose={jest.fn()}
				onClickUnban={jest.fn()}
				onLoadMore={nextOnLoadMore}
			/>,
		);

		fireEvent.scroll(screen.getByTestId('banned-users-virtual-list'));
		await advanceDebouncedScroll();

		expect(onLoadMore).toHaveBeenCalledTimes(1);
		expect(nextOnLoadMore).not.toHaveBeenCalled();
	});

	it('calls onLoadMore when the viewport is underfilled', () => {
		const onLoadMore = jest.fn();
		mockVirtualizerHandle.scrollSize = 200;

		renderBannedUsers({ onLoadMore });

		expect(onLoadMore).toHaveBeenCalledTimes(1);
	});

	it('does not call onLoadMore before the virtualizer handle is ready', async () => {
		jest.useFakeTimers();
		const onLoadMore = jest.fn();
		mockVirtualizerHasHandle = false;

		renderBannedUsers({ onLoadMore });

		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('banned-users-virtual-list'));
		await advanceDebouncedScroll();

		expect(onLoadMore).not.toHaveBeenCalled();
	});
});
