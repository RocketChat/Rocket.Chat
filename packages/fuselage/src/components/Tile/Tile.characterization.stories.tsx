import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import Tile from './Tile';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Tile on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Tile',
	component: Tile,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Tile>;

type Story = StoryObj<typeof Tile>;

const ref = createRef<HTMLDivElement>();

export const Forwarding: Story = {
	render: () => (
		<Tile
			ref={ref}
			className='consumer-class'
			id='tile-id'
			title='tile title'
			data-qa='tile-qa'
			data-anything='anything'
			aria-label='tile label'
		>
			content
		</Tile>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-tile', {
			'className': 'consumer-class',
			'id': 'tile-id',
			'title': 'tile title',
			'data-qa': 'tile-qa',
			'data-anything': 'anything',
			'aria-label': 'tile label',
			ref,
		});
	},
};

const everyVariation = (
	<div>
		<Tile>default</Tile>
		<Tile elevation='0'>zero</Tile>
		<Tile elevation='2' flush>
			two flush
		</Tile>
		<Tile elevation='1nb'>one nb</Tile>
		<Tile elevation='2nb'>two nb</Tile>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- text: "default"', '- text: "zero"', '- text: "two flush"', '- text: "one nb"', '- text: "two nb"'].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > div[0]: rcx-box rcx-box--full rcx-tile rcx-tile--elevation-1',
				'root > div > div[1]: rcx-box rcx-box--full rcx-tile rcx-tile--elevation-0',
				'root > div > div[2]: rcx-box rcx-box--full rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
				'root > div > div[3]: rcx-box rcx-box--full rcx-tile rcx-tile--elevation-1nb',
				'root > div > div[4]: rcx-box rcx-box--full rcx-tile rcx-tile--elevation-2nb',
			].join('\n'),
		);
	},
};
