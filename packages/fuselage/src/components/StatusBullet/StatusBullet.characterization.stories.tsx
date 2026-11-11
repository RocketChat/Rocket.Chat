import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import StatusBullet from './StatusBullet';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of StatusBullet on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/StatusBullet',
	component: StatusBullet,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof StatusBullet>;

type Story = StoryObj<typeof StatusBullet>;

const ref = createRef<SVGSVGElement>();

export const Forwarding: Story = {
	render: () => (
		<StatusBullet
			ref={ref}
			status='online'
			className='consumer-class'
			id='bullet-id'
			title='Online'
			data-qa='bullet-qa'
			data-anything='anything'
		/>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'svg', {
			'className': 'consumer-class',
			'id': 'bullet-id',
			'title': 'Online',
			'data-qa': 'bullet-qa',
			'data-anything': 'anything',
			ref,
		});
	},
};

export const AlwaysHiddenFromAssistiveTech: Story = {
	render: () => <StatusBullet status='away' aria-hidden='false' />,
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	},
};

const everyVariation = (
	<div>
		<StatusBullet />
		<StatusBullet status='online' />
		<StatusBullet status='away' />
		<StatusBullet status='busy' />
		<StatusBullet status='disabled' />
		<StatusBullet status='offline' />
		<StatusBullet status='online' size='small' />
		<StatusBullet status='loading' size='large' />
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
				'root > div > svg[0]: rcx-status-bullet rcx-status-bullet--loading',
				'root > div > svg[0] > circle: rcx-status-bullet rcx-status-bullet--loading',
				'root > div > svg[1]: rcx-status-bullet rcx-status-bullet--online',
				'root > div > svg[2]: rcx-status-bullet rcx-status-bullet--away',
				'root > div > svg[3]: rcx-status-bullet rcx-status-bullet--busy',
				'root > div > svg[4]: rcx-status-bullet rcx-status-bullet--disabled',
				'root > div > svg[5]: rcx-status-bullet rcx-status-bullet--offline',
				'root > div > svg[5] > circle: rcx-status-bullet rcx-status-bullet--offline',
				'root > div > svg[6]: rcx-status-bullet rcx-status-bullet--online rcx-status-bullet--small',
				'root > div > svg[7]: rcx-status-bullet rcx-status-bullet--loading',
				'root > div > svg[7] > circle: rcx-status-bullet rcx-status-bullet--loading',
			].join('\n'),
		);
	},
};
