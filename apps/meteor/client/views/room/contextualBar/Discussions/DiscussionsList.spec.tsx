import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

import * as stories from './DiscussionsList.stories';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: jest.fn(() => ({})),
	},
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
	onScroll?: (offset: number) => void;
	as?: React.ElementType;
	item?: React.ElementType;
	shift?: boolean;
	style?: CSSProperties;
	className?: string;
};

jest.mock('virtua', () => {
	return {
		Virtualizer: React.forwardRef(
			(
				{ children, onScroll, as: asRoot = 'div', item: asItem = 'div', shift: _shift, style, className }: MockVListProps,
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
						data-testid='discussions-virtual-list'
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
const testCases = Object.values(composed).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('DiscussionsList', () => {
	it('renders Default with virtual list and discussion rows', () => {
		const { Default } = composed;
		render(<Default />);

		const list = screen.getByTestId('discussions-virtual-list');
		expect(list).toBeInTheDocument();
		expect(list.tagName.toLowerCase()).toBe('ul');
		expect(within(list).getAllByRole('listitem')).toHaveLength(10);
		expect(within(list).getAllByText('user.name')).toHaveLength(10);
	});

	it('renders Empty without virtual list', () => {
		const { Empty } = composed;
		render(<Empty />);

		expect(screen.queryByTestId('discussions-virtual-list')).not.toBeInTheDocument();
		expect(screen.getByText('No_Discussions_found')).toBeInTheDocument();
	});

	it('renders Loading without virtual list', () => {
		const { Loading } = composed;
		render(<Loading />);

		expect(screen.queryByTestId('discussions-virtual-list')).not.toBeInTheDocument();
	});
});

test.each(testCases)('renders %s with stable structure', (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
