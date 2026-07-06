import type { VideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import VideoConfList from './VideoConfList';

const mockJoinCall = jest.fn();
const mockGoToRoom = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => mockJoinCall,
}));

jest.mock('../../../hooks/useGoToRoom', () => ({
	useGoToRoom: () => mockGoToRoom,
}));

jest.mock('../../../../../hooks/useTimeAgo', () => ({
	useTimeAgo: () => () => 'just now',
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

jest.mock('virtua', () => ({
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
					data-testid='video-conf-virtual-list'
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

const createVideoConf = (overrides: Partial<VideoConference> = {}): VideoConference =>
	({
		_id: 'video-conf-id',
		_updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		createdBy: {
			_id: 'creator-id',
			name: 'Creator Name',
			username: 'creator',
		},
		messages: {},
		providerName: 'provider',
		rid: 'room-id',
		status: 0,
		type: 'videoconference',
		users: [
			{
				_id: 'creator-id',
				avatarETag: null,
				name: 'Creator Name',
				ts: new Date('2026-01-01T00:00:00.000Z'),
				username: 'creator',
			},
			{
				_id: 'joined-user-id',
				avatarETag: null,
				name: 'Joined User',
				ts: new Date('2026-01-01T00:00:00.000Z'),
				username: 'joined-user',
			},
		],
		...overrides,
	}) as VideoConference;

const renderVideoConfList = (props: Partial<Parameters<typeof VideoConfList>[0]> = {}) => {
	const defaultProps = {
		error: undefined,
		loading: false,
		loadMoreItems: jest.fn(),
		onClose: jest.fn(),
		reload: jest.fn(),
		total: 1,
		videoConfs: [createVideoConf()],
	};

	return {
		...render(<VideoConfList {...defaultProps} {...props} />, {
			wrapper: mockAppRoot().build(),
		}),
	};
};

beforeEach(() => {
	jest.clearAllMocks();
	mockVirtualizerHandle.scrollOffset = 0;
	mockVirtualizerHandle.scrollSize = 1000;
	mockVirtualizerHandle.viewportSize = 300;
});

afterEach(() => {
	jest.useRealTimers();
});

const advanceDebouncedScroll = async () => {
	await act(async () => {
		await jest.advanceTimersByTimeAsync(300);
	});
};

it('renders calls through PaginatedVirtualList', () => {
	renderVideoConfList();

	const list = screen.getByTestId('video-conf-virtual-list');
	expect(list.tagName.toLowerCase()).toBe('ul');
	expect(list).toHaveAttribute('data-buffer-size', '25');
	expect(within(list).getAllByRole('listitem')).toHaveLength(1);
});

it('calls loadMoreItems when the virtual list scrolls near the end', async () => {
	jest.useFakeTimers();
	const loadMoreItems = jest.fn().mockResolvedValue(undefined);
	renderVideoConfList({ loadMoreItems, total: 2 });

	mockVirtualizerHandle.scrollOffset = 700;
	fireEvent.scroll(screen.getByTestId('video-conf-virtual-list'));
	await advanceDebouncedScroll();

	expect(loadMoreItems).toHaveBeenCalledTimes(1);
});

it('keeps call row actions unchanged', async () => {
	const user = userEvent.setup();
	const reload = jest.fn();
	renderVideoConfList({ reload });

	await user.click(screen.getByRole('button', { name: 'Join_call' }));

	expect(mockJoinCall).toHaveBeenCalledWith('video-conf-id');
	expect(reload).toHaveBeenCalledTimes(1);
});

it('keeps discussion navigation unchanged', async () => {
	const user = userEvent.setup();
	renderVideoConfList({ videoConfs: [createVideoConf({ discussionRid: 'discussion-room-id' })] });

	await user.click(screen.getByTitle('Join_discussion'));

	expect(mockGoToRoom).toHaveBeenCalledWith('discussion-room-id');
});

it('renders empty state without a virtual list', () => {
	renderVideoConfList({ total: 0, videoConfs: [] });

	expect(screen.getByText('No_history')).toBeInTheDocument();
	expect(screen.getByText('There_is_no_video_conference_history_in_this_room')).toBeInTheDocument();
	expect(screen.queryByTestId('video-conf-virtual-list')).not.toBeInTheDocument();
});

it('renders error state without a virtual list', () => {
	renderVideoConfList({ error: new Error('failed'), total: 0, videoConfs: [] });

	expect(screen.getByText('Something_went_wrong')).toBeInTheDocument();
	expect(screen.queryByTestId('video-conf-virtual-list')).not.toBeInTheDocument();
});

it('has no accessibility violations', async () => {
	const { container } = renderVideoConfList();

	expect(await axe(container)).toHaveNoViolations();
});

it('renders with stable structure', () => {
	const { baseElement } = renderVideoConfList();

	expect(baseElement).toMatchSnapshot();
});
