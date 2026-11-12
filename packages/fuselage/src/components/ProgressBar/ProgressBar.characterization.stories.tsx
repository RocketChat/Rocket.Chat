import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import ProgressBar from './ProgressBar';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of ProgressBar on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/ProgressBar',
	component: ProgressBar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof ProgressBar>;

type Story = StoryObj<typeof ProgressBar>;

const ref = createRef<HTMLDivElement>();

export const Forwarding: Story = {
	render: () => (
		<ProgressBar
			ref={ref}
			percentage={40}
			className='consumer-class'
			id='progress-id'
			title='progress title'
			data-qa='progress-qa'
			data-anything='anything'
			aria-label='progress label'
		/>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-progress-bar', {
			'id': 'progress-id',
			'title': 'progress title',
			'data-qa': 'progress-qa',
			'data-anything': 'anything',
			'aria-label': 'progress label',
			ref,
		});
		// Not through `expectForwards`: on develop the `overflow` css-in-js class (`rcx-css-*`) lands after the consumer class
		await expect(canvasElement.querySelector('.rcx-progress-bar')).toHaveClass('consumer-class');
	},
};

export const ErrorBecomesTitle: Story = {
	render: () => <ProgressBar percentage={10} error='Upload failed' />,
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('.rcx-progress-bar')).toHaveAttribute('title', 'Upload failed');
	},
};

const everyVariation = (
	<div>
		<ProgressBar percentage={0} />
		<ProgressBar percentage={50} variant='success' />
		<ProgressBar percentage={120} variant='warning' light />
		<ProgressBar percentage={-5} variant='danger' animated />
		<ProgressBar percentage={30} error='failed' />
		<ProgressBar percentage={25} role='progressbar' aria-label='Usage' aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} />
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(['- progressbar "Usage"'].join('\n'));
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > div[0]: rcx-box rcx-box--full rcx-progress-bar',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-progress-bar__fill',
				'root > div > div[1]: rcx-box rcx-box--full rcx-progress-bar',
				'root > div > div[1] > div: rcx-box rcx-box--full rcx-progress-bar__fill',
				'root > div > div[2]: rcx-box rcx-box--full rcx-progress-bar',
				'root > div > div[2] > div: rcx-box rcx-box--full rcx-progress-bar__fill',
				'root > div > div[3]: rcx-box rcx-box--full rcx-progress-bar',
				'root > div > div[3] > div: rcx-box rcx-box--full rcx-progress-bar__fill rcx-progress-bar__fill--animated',
				'root > div > div[4]: rcx-box rcx-box--full rcx-progress-bar',
				'root > div > div[4] > div: rcx-box rcx-box--full rcx-progress-bar__fill',
				'root > div > div[5]: rcx-box rcx-box--full rcx-progress-bar',
				'root > div > div[5] > div: rcx-box rcx-box--full rcx-progress-bar__fill',
			].join('\n'),
		);
	},
};
