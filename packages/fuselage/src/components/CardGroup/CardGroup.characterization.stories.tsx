import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent } from 'storybook/test';

import CardGroup from './CardGroup';
import { ariaSnapshot, classContract, computed, expectForwards, isJsdom } from '../../testing/g0';
import { Card } from '../Card';

// G0 characterization of CardGroup on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md. The spacing is asserted as the distances between the cards, not as the
// margins or the `rcx-card-group__item` class that produce them today.
export default {
	title: 'Characterization/CardGroup',
	component: CardGroup,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof CardGroup>;

type Story = StoryObj<typeof CardGroup>;

const onClick = fn();

const cards = (count: number) =>
	Array.from({ length: count }, (_, index) => (
		<Card key={index} data-card={index}>
			<div style={{ width: 100, height: 50 }}>{index}</div>
		</Card>
	));

export const Forwarding: Story = {
	render: () => (
		<CardGroup
			className='consumer-class'
			id='group-id'
			title='group title'
			data-qa='group-qa'
			data-anything='anything'
			aria-label='group label'
			onClick={onClick}
		>
			{cards(2)}
		</CardGroup>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-card-group', {
			'className': 'consumer-class',
			'id': 'group-id',
			'title': 'group title',
			'data-qa': 'group-qa',
			'data-anything': 'anything',
			'aria-label': 'group label',
			'handlers': { onClick },
		});
		await expect(canvasElement.querySelector('.rcx-card-group')).toHaveAttribute('role', 'group');
	},
};

export const ChildrenPassThrough: Story = {
	render: () => (
		<CardGroup>
			{cards(2)}
			{null}
			{false}
			text
		</CardGroup>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelectorAll('.rcx-card')).toHaveLength(2);
		await userEvent.click(canvasElement.querySelector('.rcx-card') as HTMLElement);
		await expect(canvasElement.querySelector('.rcx-card-group')).toHaveTextContent('01text');
	},
};

const everyVariation = (
	<>
		<CardGroup>{cards(2)}</CardGroup>
		<CardGroup align='center' stretch>
			{cards(2)}
		</CardGroup>
		<CardGroup align='end' wrap>
			{cards(2)}
		</CardGroup>
		<CardGroup vertical>{cards(2)}</CardGroup>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group:',
				'  - text: "0"',
				'  - text: "1"',
				'- group:',
				'  - text: "0"',
				'  - text: "1"',
				'- group:',
				'  - text: "0"',
				'  - text: "1"',
				'- group:',
				'  - text: "0"',
				'  - text: "1"',
			].join('\n'),
		);
	},
};

// The `rcx-card-group__item` class CardGroup adds to every child is left out: the spacing it carried moves to the group's gap
export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement).replaceAll(' rcx-card-group__item', '')).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-card-group rcx-card-group--align-start',
				'root > div[0] > div[0]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[0] > div[1]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[1]: rcx-box rcx-box--full rcx-card-group rcx-card-group--align-center rcx-card-group--stretch',
				'root > div[1] > div[0]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[1] > div[1]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[2]: rcx-box rcx-box--full rcx-card-group rcx-card-group--align-end rcx-card-group--wrap',
				'root > div[2] > div[0]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[2] > div[1]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[3]: rcx-box rcx-box--full rcx-card-group rcx-card-group--align-start rcx-card-group--vertical',
				'root > div[3] > div[0]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[3] > div[1]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
			].join('\n'),
		);
	},
};

const rects = (group: Element) => [...group.querySelectorAll('.rcx-card')].map((card) => card.getBoundingClientRect());

export const Spacing: Story = {
	render: () => (
		<div style={{ width: 600 }}>
			<div id='row'>
				<CardGroup>{cards(3)}</CardGroup>
			</div>
			<div id='column'>
				<CardGroup vertical>{cards(3)}</CardGroup>
			</div>
			<div id='wrap'>
				<CardGroup wrap>{cards(3)}</CardGroup>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const group = (id: string) => canvasElement.querySelector(`#${id} .rcx-card-group`) as HTMLElement;

		// Side by side: 16px between the cards and none before the first or after the last
		const row = rects(group('row'));
		await expect(row[0].left).toBe(group('row').getBoundingClientRect().left);
		await expect(row[1].left - row[0].right).toBe(16);
		await expect(row[2].left - row[1].right).toBe(16);

		// Stacked: 8px between the cards
		const column = rects(group('column'));
		await expect(column[1].top - column[0].bottom).toBe(8);
		await expect(column[2].top - column[1].bottom).toBe(8);
		await expect(column[0].top).toBe(group('column').getBoundingClientRect().top);

		// Wrapping: 16px both ways, and the outer edges sit 8px inside the group
		const wrap = rects(group('wrap'));
		await expect(wrap[0].left - group('wrap').getBoundingClientRect().left).toBe(8);
		await expect(wrap[1].left - wrap[0].right).toBe(16);
		await expect(computed(group('wrap'), 'flex-wrap')).toBe('wrap');
	},
};

export const WrapRows: Story = {
	render: () => (
		<div style={{ width: 340 }}>
			<CardGroup wrap>{cards(3)}</CardGroup>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const [first, second, third] = rects(canvasElement.querySelector('.rcx-card-group') as HTMLElement);
		// Two cards fit on the first line and the third goes below, 16px lower
		await expect(second.top).toBe(first.top);
		await expect(third.top - first.bottom).toBe(16);
	},
};

export const Stretch: Story = {
	render: () => (
		<div style={{ width: 600 }}>
			<div id='row'>
				<CardGroup stretch>{cards(2)}</CardGroup>
			</div>
			<div id='column'>
				<CardGroup stretch vertical>
					{cards(2)}
				</CardGroup>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const row = rects(canvasElement.querySelector('#row .rcx-card-group') as HTMLElement);
		// The cards share the line, less the 16px between them
		await expect(row[0].width).toBe(row[1].width);
		await expect(row[0].width + row[1].width + 16).toBe(600);
		const column = canvasElement.querySelectorAll<HTMLElement>('#column .rcx-card');
		await expect(computed(column[0], 'flex-grow')).toBe('1');
	},
};

export const Alignment: Story = {
	render: () => (
		<div style={{ width: 600 }}>
			<div id='start'>
				<CardGroup>{cards(1)}</CardGroup>
			</div>
			<div id='center'>
				<CardGroup align='center'>{cards(1)}</CardGroup>
			</div>
			<div id='end'>
				<CardGroup align='end'>{cards(1)}</CardGroup>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const left = (id: string) => rects(canvasElement.querySelector(`#${id} .rcx-card-group`) as HTMLElement)[0].left;
		const origin = (canvasElement.querySelector('#start') as HTMLElement).getBoundingClientRect().left;
		const { width } = rects(canvasElement.querySelector('#start .rcx-card-group') as HTMLElement)[0];
		await expect(left('start')).toBe(origin);
		await expect(left('center')).toBe(origin + (600 - width) / 2);
		await expect(left('end')).toBe(origin + 600 - width);
	},
};
