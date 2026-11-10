import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import Badge from './Badge';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Badge on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Badge',
	component: Badge,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Badge>;

type Story = StoryObj<typeof Badge>;

export const Forwarding: Story = {
	render: () => (
		<Badge
			className='consumer-class'
			id='badge-id'
			title='badge title'
			data-qa='badge-qa'
			data-anything='anything'
			aria-label='badge label'
		>
			9
		</Badge>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'span', {
			'className': 'consumer-class',
			'id': 'badge-id',
			'title': 'badge title',
			'data-qa': 'badge-qa',
			'data-anything': 'anything',
			'aria-label': 'badge label',
		});
	},
};

const everyVariation = (
	<div>
		<Badge>1</Badge>
		<Badge variant='primary'>2</Badge>
		<Badge variant='danger'>3</Badge>
		<Badge variant='warning'>4</Badge>
		<Badge variant='primary' small />
		<Badge role='status' aria-live='polite' aria-label='3 unread'>
			3
		</Badge>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- text: "1"', '- text: "2"', '- text: "3"', '- text: "4"', '- status "3 unread":', '  - text: "3"'].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > span[0]: rcx-badge rcx-badge--secondary rcx-box rcx-box--full',
				'root > div > span[1]: rcx-badge rcx-badge--primary rcx-box rcx-box--full',
				'root > div > span[2]: rcx-badge rcx-badge--danger rcx-box rcx-box--full',
				'root > div > span[3]: rcx-badge rcx-badge--warning rcx-box rcx-box--full',
				'root > div > span[4]: rcx-badge rcx-badge--primary rcx-badge--small rcx-box rcx-box--full',
				'root > div > span[5]: rcx-badge rcx-badge--secondary rcx-box rcx-box--full',
			].join('\n'),
		);
	},
};
