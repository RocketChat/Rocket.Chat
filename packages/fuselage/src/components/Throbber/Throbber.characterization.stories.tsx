import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import Throbber from './Throbber';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Throbber on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Throbber',
	component: Throbber,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Throbber>;

type Story = StoryObj<typeof Throbber>;

const ref = createRef<HTMLDivElement>();

export const Forwarding: Story = {
	render: () => (
		<Throbber
			ref={ref}
			className='consumer-class'
			id='throbber-id'
			title='throbber title'
			data-qa='throbber-qa'
			data-anything='anything'
			aria-label='throbber label'
		/>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-throbber', {
			'className': 'consumer-class',
			'id': 'throbber-id',
			'title': 'throbber title',
			'data-qa': 'throbber-qa',
			'data-anything': 'anything',
			'aria-label': 'throbber label',
			ref,
		});
	},
};

export const CircleCount: Story = {
	render: () => (
		<div>
			<Throbber />
			<Throbber circleCount={5} size='x24' />
		</div>
	),
	play: async ({ canvasElement }) => {
		const [three, five] = [...canvasElement.querySelectorAll('.rcx-throbber')];
		await expect(three.children).toHaveLength(3);
		await expect(five.children).toHaveLength(5);
	},
};

const everyVariation = (
	<div>
		<Throbber />
		<Throbber disabled />
		<Throbber inheritColor />
		<Throbber circleCount={2} size='x12' />
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe('');
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > div[0]: rcx-box rcx-box--full rcx-throbber',
				'root > div > div[0] > span[0]: rcx-box rcx-box--full rcx-throbber__circle',
				'root > div > div[0] > span[1]: rcx-box rcx-box--full rcx-throbber__circle',
				'root > div > div[0] > span[2]: rcx-box rcx-box--full rcx-throbber__circle',
				'root > div > div[1]: rcx-box rcx-box--full rcx-throbber',
				'root > div > div[1] > span[0]: rcx-box rcx-box--full rcx-throbber__circle rcx-throbber__circle--disabled',
				'root > div > div[1] > span[1]: rcx-box rcx-box--full rcx-throbber__circle rcx-throbber__circle--disabled',
				'root > div > div[1] > span[2]: rcx-box rcx-box--full rcx-throbber__circle rcx-throbber__circle--disabled',
				'root > div > div[2]: rcx-box rcx-box--full rcx-throbber',
				'root > div > div[2] > span[0]: rcx-box rcx-box--full rcx-throbber__circle rcx-throbber__circle--inherit-color',
				'root > div > div[2] > span[1]: rcx-box rcx-box--full rcx-throbber__circle rcx-throbber__circle--inherit-color',
				'root > div > div[2] > span[2]: rcx-box rcx-box--full rcx-throbber__circle rcx-throbber__circle--inherit-color',
				'root > div > div[3]: rcx-box rcx-box--full rcx-throbber',
				'root > div > div[3] > span[0]: rcx-box rcx-box--full rcx-throbber__circle',
				'root > div > div[3] > span[1]: rcx-box rcx-box--full rcx-throbber__circle',
			].join('\n'),
		);
	},
};
