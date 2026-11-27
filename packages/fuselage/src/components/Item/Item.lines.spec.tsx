import { render } from '@testing-library/react';
import { Profiler } from 'react';
import type { ReactNode } from 'react';

import Item, { holdsLines } from './Item';
import ItemContent from './ItemContent';
import ItemDescription from './ItemDescription';
import ItemTitle from './ItemTitle';

const Wrapped = ({ children }: { children?: ReactNode }) => <ItemContent>{children}</ItemContent>;

const lines = [<ItemTitle key='title'>Title</ItemTitle>, <ItemDescription key='description'>Description</ItemDescription>];

describe('holdsLines', () => {
	it('counts the children of the content among the slots, through a fragment', () => {
		expect(holdsLines(<ItemContent>{lines}</ItemContent>)).toBe(true);
		expect(
			holdsLines(
				<>
					<span />
					<ItemContent>{lines}</ItemContent>
				</>,
			),
		).toBe(true);
	});

	it('takes one line, or a child that renders nothing, as one line', () => {
		expect(
			holdsLines(
				<ItemContent>
					<ItemTitle>Title</ItemTitle>
					{false}
				</ItemContent>,
			),
		).toBe(false);
	});

	it('sees the content a wrapper renders only when told which component it is', () => {
		expect(holdsLines(<Wrapped>{lines}</Wrapped>)).toBe(false);
		expect(holdsLines(<Wrapped>{lines}</Wrapped>, Wrapped)).toBe(true);
	});
});

describe('the lines of a row', () => {
	const renders = (row: ReactNode) => {
		const onRender = jest.fn();
		render(
			<Profiler id='item' onRender={onRender}>
				{row}
			</Profiler>,
		);
		return onRender.mock.calls.length;
	};

	it('are known on the first render when the row holds its content directly', () => {
		expect(
			renders(
				<Item>
					<ItemContent>{lines}</ItemContent>
				</Item>,
			),
		).toBe(1);
	});

	it('are reported by content the row cannot see, which costs a second render', () => {
		expect(
			renders(
				<Item>
					<Wrapped>{lines}</Wrapped>
				</Item>,
			),
		).toBe(2);
	});

	it('cost no second render when the row is told', () => {
		expect(
			renders(
				<Item multiline>
					<Wrapped>{lines}</Wrapped>
				</Item>,
			),
		).toBe(1);
		expect(
			renders(
				<Item multiline={false}>
					<Wrapped>{lines}</Wrapped>
				</Item>,
			),
		).toBe(1);
	});
});
