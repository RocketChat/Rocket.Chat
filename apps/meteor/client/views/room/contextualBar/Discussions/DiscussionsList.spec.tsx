import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';

import DiscussionsList from './DiscussionsList';

// DiscussionsListRow brings in its own hooks (useTimeAgo, normalizeThreadMessage, etc.).
// Mock it to a simple sentinel so tests stay focused on DiscussionsList behaviour.
jest.mock('./DiscussionsListRow', () => () => <div data-testid='discussion-row' />);

// goToRoomById traverses a deep import chain that includes non-JS assets.
jest.mock('../../../../lib/utils/goToRoomById', () => ({ goToRoomById: jest.fn() }));

// JSDOM has no layout engine, so useVirtualizer can't calculate visible ranges.
// Replace it with a deterministic implementation that always renders all items.
jest.mock('@tanstack/react-virtual', () => ({
	useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: (i: number) => number }) => ({
		getVirtualItems: () =>
			Array.from({ length: count }, (_, i) => ({
				key: i,
				index: i,
				start: i * estimateSize(i),
				end: (i + 1) * estimateSize(i),
				size: estimateSize(i),
				lane: 0,
			})),
		getTotalSize: () => count * estimateSize(0),
		measureElement: () => undefined,
	}),
}));

// CustomScrollbars uses OverlayScrollbars which is unavailable in JSDOM.
// Replace with a forwardRef div so the VirtualList scroll-element ref is wired correctly.
jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	CustomScrollbars: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CustomScrollbars({ children, ...props }, ref) {
		return (
			<div ref={ref} {...props}>
				{children}
			</div>
		);
	}),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useSetting: () => false,
	useLayoutSizes: () => ({ contextualBar: 'wide' }),
	useLayoutContextualBarPosition: () => 'side',
	useRoomToolbox: () => ({ closeTab: jest.fn() }),
}));

const defaultProps = {
	total: 0,
	discussions: [] as IDiscussionMessage[],
	loadMoreItems: jest.fn(),
	loading: false,
	onClose: jest.fn(),
	error: undefined as unknown,
	text: '',
	onChangeFilter: jest.fn(),
};

const createFakeDiscussion = (id: string): IDiscussionMessage =>
	({
		_id: id,
		rid: 'room-id',
		msg: `Discussion message ${id}`,
		ts: new Date(),
		u: { _id: 'user-id', username: 'testuser', name: 'Test User' },
		_updatedAt: new Date(),
		drid: `drid-${id}`,
		dcount: 2,
		dlm: new Date(),
	}) as IDiscussionMessage;

describe('DiscussionsList', () => {
	it('should hide the empty state while loading', () => {
		render(<DiscussionsList {...defaultProps} loading={true} total={0} />);

		expect(screen.queryByText('No_Discussions_found')).not.toBeInTheDocument();
	});

	it('should display an error message when error is an Error instance', () => {
		render(<DiscussionsList {...defaultProps} error={new Error('Something went wrong')} />);

		expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
	});

	it('should display the empty state when there are no discussions and loading is done', () => {
		render(<DiscussionsList {...defaultProps} loading={false} total={0} />);

		expect(screen.getByText('No_Discussions_found')).toBeInTheDocument();
	});

	it('should render a row for each discussion item', () => {
		const discussions = [createFakeDiscussion('1'), createFakeDiscussion('2'), createFakeDiscussion('3')];

		render(<DiscussionsList {...defaultProps} total={discussions.length} discussions={discussions} />);

		expect(screen.getAllByTestId('discussion-row')).toHaveLength(discussions.length);
	});
});
