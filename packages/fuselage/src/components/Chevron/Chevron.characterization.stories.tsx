import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import Chevron from './Chevron';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Chevron on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Chevron',
	component: Chevron,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Chevron>;

type Story = StoryObj<typeof Chevron>;

const forwardedRef = createRef<HTMLSpanElement>();

export const Forwarding: Story = {
	render: () => (
		<Chevron
			ref={forwardedRef}
			className='consumer-class'
			id='chevron-id'
			title='chevron title'
			data-qa='chevron-qa'
			data-anything='anything'
			aria-label='chevron label'
		/>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'span', {
			'className': 'consumer-class',
			'id': 'chevron-id',
			'title': 'chevron title',
			'data-qa': 'chevron-qa',
			'data-anything': 'anything',
			'aria-label': 'chevron label',
			'ref': forwardedRef,
		});
	},
};

const everyVariation = (
	<div>
		<Chevron />
		<Chevron up />
		<Chevron down />
		<Chevron right />
		<Chevron left />
		<Chevron size='x24' />
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		// The glyph is aria-hidden, so a chevron has no accessible content
		await expect(ariaSnapshot(canvasElement)).toBe('');
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > span[0]: rcx-box rcx-box--full rcx-chevron',
				'root > div > span[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > span[1]: rcx-box rcx-box--full rcx-chevron rcx-chevron--up',
				'root > div > span[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > span[2]: rcx-box rcx-box--full rcx-chevron rcx-chevron--down',
				'root > div > span[2] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > span[3]: rcx-box rcx-box--full rcx-chevron rcx-chevron--right',
				'root > div > span[3] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > span[4]: rcx-box rcx-box--full rcx-chevron rcx-chevron--left',
				'root > div > span[4] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > span[5]: rcx-box rcx-box--full rcx-chevron',
				'root > div > span[5] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			].join('\n'),
		);
	},
};

export const Icon: Story = {
	render: () => <Chevron size='x24' />,
	play: async ({ canvasElement }) => {
		const icon = canvasElement.querySelector('i.rcx-icon');
		await expect(icon).toHaveTextContent(/./);
		await expect(icon).toHaveAttribute('aria-hidden', 'true');
	},
};
