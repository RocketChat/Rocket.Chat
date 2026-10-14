import { describe, it, mock, test } from 'node:test';

import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import * as React from 'react';
import { Children, forwardRef, isValidElement } from 'react';

const mockVirtualizerHandle = {
	scrollToIndex: fn<FunctionLike>(),
	scrollTo: fn<FunctionLike>(),
	findItemIndex: fn<FunctionLike>((offset: number) => offset),
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

mock.module('../../../../lib/rooms/roomCoordinator', {
	exports: {
		roomCoordinator: {
			getRoomDirectives: fn<FunctionLike>(() => ({})),
		},
	},
});
mock.module(require.resolve('virtua'), {
	exports: {
		default: (() => {
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
		})(),
	},
});
mock.module(require.resolve('@rocket.chat/ui-client'), {
	exports: {
		...require('@rocket.chat/ui-client'),

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
	},
});
const stories: typeof import('./DiscussionsList.stories') = require('./DiscussionsList.stories');

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

testCases.forEach(([_storyname, Story]) => {
	test(`renders ${_storyname} with stable structure`, (t) => {
		const { baseElement } = render(<Story />);
		t.assert.snapshot(baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`${_storyname} should have no a11y violations`, async () => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
