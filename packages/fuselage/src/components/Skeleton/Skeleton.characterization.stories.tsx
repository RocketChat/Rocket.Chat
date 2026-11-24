import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import Skeleton from './Skeleton';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Skeleton on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Skeleton',
	component: Skeleton,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Skeleton>;

type Story = StoryObj<typeof Skeleton>;

const forwardedRef = createRef<HTMLSpanElement>();

// `ref` is forwarded at runtime but absent from the type withBoxStyling exposes, so it goes in through a spread
export const Forwarding: Story = {
	render: () => (
		<Skeleton
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='skeleton-id'
			title='skeleton title'
			data-qa='skeleton-qa'
			data-anything='anything'
			aria-label='skeleton label'
			aria-busy
			aria-hidden='true'
			role='presentation'
		/>
	),
	play: async ({ canvasElement }) => {
		const skeleton = canvasElement.querySelector('span') as HTMLSpanElement;
		await expectForwards(canvasElement, skeleton, {
			'className': 'consumer-class',
			'id': 'skeleton-id',
			'title': 'skeleton title',
			'data-qa': 'skeleton-qa',
			'data-anything': 'anything',
			'aria-label': 'skeleton label',
			'ref': forwardedRef,
		});
		await expect(skeleton).toHaveAttribute('aria-busy', 'true');
		await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
		await expect(skeleton).toHaveAttribute('role', 'presentation');
	},
};

export const Empty: Story = {
	render: () => <Skeleton />,
	play: async ({ canvasElement }) => {
		const skeleton = canvasElement.querySelector('span') as HTMLSpanElement;
		await expect(skeleton.childNodes.length).toBe(0);
	},
};

const everyVariation = (
	<>
		<Skeleton />
		<Skeleton variant='text' />
		<Skeleton variant='rect' width={40} height={40} />
		<Skeleton variant='circle' width={16} height={16} />
		<Skeleton inverted width='x200' />
	</>
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
				'root > span[0]: rcx-skeleton rcx-skeleton--text',
				'root > span[1]: rcx-skeleton rcx-skeleton--text',
				'root > span[2]: rcx-skeleton rcx-skeleton--rect',
				'root > span[3]: rcx-skeleton rcx-skeleton--circle',
				'root > span[4]: rcx-skeleton rcx-skeleton--inverted rcx-skeleton--text',
			].join('\n'),
		);
	},
};
