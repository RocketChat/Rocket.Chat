import type { ICalendarEvent, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import OutlookEventsList from './OutlookEventsList';

const mockChangeRoute = jest.fn();
const mockOnClose = jest.fn();
const mockSyncOutlookCalendar = jest.fn();

const mockCalendarEvents: Serialized<ICalendarEvent>[] = [
	{
		_id: 'calendar-event-1',
		_updatedAt: '2026-01-01T00:00:00.000Z',
		startTime: '2026-01-01T10:00:00.000Z',
		endTime: '2026-01-01T11:00:00.000Z',
		uid: 'user-id',
		subject: 'Planning sync',
		description: 'Project planning',
		notificationSent: false,
	},
	{
		_id: 'calendar-event-2',
		_updatedAt: '2026-01-01T00:00:00.000Z',
		startTime: '2026-01-01T12:00:00.000Z',
		endTime: '2026-01-01T13:00:00.000Z',
		uid: 'user-id',
		subject: 'Design review',
		description: 'Review design',
		notificationSent: false,
	},
];

jest.mock('../hooks/useOutlookAuthentication', () => ({
	useOutlookAuthentication: () => ({
		authEnabled: true,
		isError: false,
		error: undefined,
	}),
}));

jest.mock('../hooks/useOutlookCalendarList', () => ({
	useMutationOutlookCalendarSync: () => ({
		isPending: false,
		mutate: mockSyncOutlookCalendar,
	}),
	useOutlookCalendarListForToday: () => ({
		data: mockCalendarEvents,
		isError: false,
		isPending: false,
		isSuccess: true,
	}),
}));

jest.mock('../../../hooks/useFormatDateAndTime', () => ({
	useFormatDateAndTime: () => (date: string | Date) => String(date),
}));

jest.mock('../hooks/useOutlookOpenCall', () => ({
	useOutlookOpenCall: () => jest.fn(),
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

jest.mock('virtua', () => ({
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
					data-testid='outlook-events-virtual-list'
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

beforeEach(() => {
	jest.clearAllMocks();
});

it('renders calendar events through PaginatedVirtualList', () => {
	render(<OutlookEventsList onClose={mockOnClose} changeRoute={mockChangeRoute} />, {
		wrapper: mockAppRoot()
			.withUser({ settings: { calendar: { outlook: { Outlook_Url: 'https://outlook.example.com' } } } })
			.build(),
	});

	const list = screen.getByTestId('outlook-events-virtual-list');

	expect(list.tagName.toLowerCase()).toBe('ul');
	expect(list).toHaveAttribute('data-buffer-size', '25');
	expect(within(list).getAllByRole('listitem')).toHaveLength(mockCalendarEvents.length);
	expect(within(list).getByText('Planning sync')).toBeInTheDocument();
	expect(within(list).getByText('Design review')).toBeInTheDocument();
});
