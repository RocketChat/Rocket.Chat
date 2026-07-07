import { UserStatus } from '@rocket.chat/core-typings';
import { composeStories } from '@storybook/react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ComponentProps, CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import RoomMembers from './RoomMembers';
import * as stories from './RoomMembers.stories';

jest.mock('../../hooks/useUserInfoActions', () => ({
	useUserInfoActions: jest.fn(),
}));

const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	scrollTo: jest.fn(),
	scrollBy: jest.fn(),
	getItemOffset: jest.fn((index: number) => index * 40),
	getItemSize: jest.fn(() => 40),
	findItemIndex: jest.fn((offset: number) => offset),
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
	cache: null,
};
let mockVirtualizerHasHandle = true;

type MockVirtualizerProps = {
	children: ReactNode;
	bufferSize?: number;
	keepMounted?: readonly number[];
	onScroll?: (offset: number) => void;
	as?: React.ElementType;
	item?: React.ElementType;
	style?: CSSProperties;
	className?: string;
};

jest.mock('virtua', () => ({
	Virtualizer: React.forwardRef(
		(
			{ children, bufferSize, keepMounted, onScroll, as: asRoot = 'div', item: asItem = 'div', style, className }: MockVirtualizerProps,
			ref: React.Ref<unknown>,
		) => {
			React.useImperativeHandle(ref, () => (mockVirtualizerHasHandle ? mockVirtualizerHandle : null));
			const Root = asRoot;
			const Item = asItem;
			const wrapped = Children.map(children, (child, index) => {
				const key = isValidElement(child) && child.key != null ? String(child.key) : `row-${index}`;

				return (
					<Item key={key} index={index} style={{}}>
						{child}
					</Item>
				);
			});

			return (
				<Root
					className={className}
					data-buffer-size={bufferSize}
					data-keep-mounted={keepMounted?.join(',') ?? ''}
					style={style ?? { height: '100%' }}
					onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)}
				>
					{wrapped}
				</Root>
			);
		},
	),
}));

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

const testCases = Object.entries(composeStories(stories)).map(
	([storyExportName, Story]) => [Story.storyName || storyExportName, Story, storyExportName] as const,
);
const snapshotTestCases = testCases.filter(([, , storyExportName]) => storyExportName !== 'GroupedRoles');

const renderRoomMembers = (props: Partial<ComponentProps<typeof RoomMembers>> = {}) =>
	render(
		<RoomMembers
			rid='GENERAL'
			isPending={false}
			isSuccess
			text=''
			type='online'
			setText={jest.fn()}
			setType={jest.fn()}
			onClickClose={jest.fn()}
			onClickView={jest.fn()}
			total={4}
			loadMoreItems={jest.fn().mockResolvedValue(undefined)}
			reload={jest.fn()}
			members={[
				{
					_id: 'owner',
					username: 'owner',
					status: UserStatus.ONLINE,
					roles: ['owner'],
					subscription: {
						_id: 'subscription-owner',
						ts: '2026-01-01T00:00:00.000Z',
					},
				},
				{
					_id: 'leader',
					username: 'leader',
					status: UserStatus.ONLINE,
					roles: ['leader'],
					subscription: {
						_id: 'subscription-leader',
						ts: '2026-01-01T00:00:00.000Z',
					},
				},
				{
					_id: 'moderator',
					username: 'moderator',
					status: UserStatus.ONLINE,
					roles: ['moderator'],
					subscription: {
						_id: 'subscription-moderator',
						ts: '2026-01-01T00:00:00.000Z',
					},
				},
				{
					_id: 'member',
					username: 'member',
					status: UserStatus.ONLINE,
					roles: ['user'],
					subscription: {
						_id: 'subscription-member',
						ts: '2026-01-01T00:00:00.000Z',
					},
				},
			]}
			{...props}
		/>,
	);

const advanceDebouncedScroll = async () => {
	await act(async () => {
		await jest.advanceTimersByTimeAsync(300);
	});
};

describe('RoomMembers virtualized list', () => {
	beforeEach(() => {
		mockVirtualizerHandle.findItemIndex.mockImplementation((offset: number) => offset);
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
		mockVirtualizerHasHandle = true;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renders role dividers and member rows in a Virtua list', () => {
		renderRoomMembers();

		const list = screen.getByTestId('room-members-virtual-list');

		expect(within(list).getByText('Owners')).toBeInTheDocument();
		expect(within(list).getByText('Leaders')).toBeInTheDocument();
		expect(within(list).getByText('Moderators')).toBeInTheDocument();
		expect(within(list).getByText('Members')).toBeInTheDocument();
		expect(within(list).getByText('owner')).toBeInTheDocument();
		expect(within(list).getByText('leader')).toBeInTheDocument();
		expect(within(list).getByText('moderator')).toBeInTheDocument();
		expect(within(list).getByText('member')).toBeInTheDocument();
		expect(list).toHaveAttribute('data-buffer-size', '50');
	});

	it('keeps member rows compatible with existing locators', () => {
		renderRoomMembers();

		// eslint-disable-next-line testing-library/no-node-access
		const ownerListItem = screen.getByText('owner').closest('li');
		// eslint-disable-next-line testing-library/no-node-access
		const ownerRow = screen.getByText('owner').closest('[data-username="owner"]');

		expect(ownerListItem).toHaveTextContent('owner');
		expect(ownerRow).toHaveAttribute('data-userid', 'owner');
		expect(ownerRow).toHaveAttribute('role', 'option');
	});

	it('keeps the active role divider mounted while scrolling', () => {
		renderRoomMembers();

		const list = screen.getByTestId('room-members-virtual-list');
		expect(list).toHaveAttribute('data-keep-mounted', '0');

		mockVirtualizerHandle.scrollOffset = 4;
		fireEvent.scroll(list);

		expect(list).toHaveAttribute('data-keep-mounted', '4');
	});

	it('loads more members when scrolled near the bottom', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockResolvedValue(undefined);

		renderRoomMembers({ total: 8, loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).toHaveBeenCalledTimes(1);
	});

	it('does not load more members when all members are loaded', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockResolvedValue(undefined);

		renderRoomMembers({ total: 4, loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).not.toHaveBeenCalled();
	});
});

test.each(snapshotTestCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)(
	'%s should have no a11y violations',
	async (_storyname, Story) => {
		const { container } = render(<Story />);

		// Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
		const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });
		expect(results).toHaveNoViolations();
	},
	15000,
);

describe('RoomMembers virtualized list review fixes', () => {
	beforeEach(() => {
		mockVirtualizerHandle.findItemIndex.mockImplementation((offset: number) => offset);
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
		mockVirtualizerHasHandle = true;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('uses one presentational role for virtual row wrappers', () => {
		renderRoomMembers();

		// eslint-disable-next-line testing-library/no-node-access
		const ownersDividerWrapper = screen.getByText('Owners').closest('li');
		// eslint-disable-next-line testing-library/no-node-access
		const ownerRowWrapper = screen.getByText('owner').closest('li');

		expect(ownersDividerWrapper).toHaveAttribute('role', 'none');
		expect(ownerRowWrapper).toHaveAttribute('role', 'none');
	});

	it('allows loading again after a successful load resolves without new members', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockResolvedValue(undefined);

		renderRoomMembers({ total: 8, loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).toHaveBeenCalledTimes(2);
	});

	it('does not load more before the virtualizer handle is ready', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockResolvedValue(undefined);
		mockVirtualizerHasHandle = false;

		renderRoomMembers({ total: 8, loadMoreItems });
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).not.toHaveBeenCalled();
	});

	it('does not load more when the viewport has no measurable height', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockResolvedValue(undefined);
		mockVirtualizerHandle.viewportSize = 0;

		renderRoomMembers({ total: 8, loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 1000;
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).not.toHaveBeenCalled();
	});

	it('does not start a second load while one is pending', async () => {
		jest.useFakeTimers();
		let resolveLoad: () => void = () => undefined;
		const pendingLoad = new Promise<void>((resolve) => {
			resolveLoad = resolve;
		});
		const loadMoreItems = jest.fn().mockReturnValue(pendingLoad);

		renderRoomMembers({ total: 8, loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveLoad();
			await pendingLoad;
		});
	});

	it('allows loading again after a failed load', async () => {
		jest.useFakeTimers();
		const loadMoreItems = jest.fn().mockRejectedValue(new Error('failed to load members'));

		renderRoomMembers({ total: 8, loadMoreItems });
		mockVirtualizerHandle.scrollOffset = 700;
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();
		fireEvent.scroll(screen.getByTestId('room-members-virtual-list'));
		await advanceDebouncedScroll();

		expect(loadMoreItems).toHaveBeenCalledTimes(2);
	});
});
