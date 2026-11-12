import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect } from 'storybook/test';

import Divider from './Divider';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Divider on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Divider',
	component: Divider,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Divider>;

type Story = StoryObj<typeof Divider>;

const ruleRef = createRef<HTMLElement>();
const labelledRef = createRef<HTMLElement>();

export const Forwarding: Story = {
	render: () => (
		<div>
			<Divider
				ref={ruleRef}
				className='consumer-class'
				id='rule-id'
				title='rule title'
				data-qa='rule-qa'
				data-anything='anything'
				aria-hidden='true'
			/>
			<Divider
				ref={labelledRef}
				className='consumer-class'
				id='labelled-id'
				title='labelled title'
				data-qa='labelled-qa'
				data-anything='anything'
				aria-label='labelled label'
			>
				or
			</Divider>
		</div>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'hr', {
			'className': 'consumer-class',
			'id': 'rule-id',
			'title': 'rule title',
			'data-qa': 'rule-qa',
			'data-anything': 'anything',
			'ref': ruleRef,
		});
		await expectForwards(canvasElement, '[role=separator]', {
			'className': 'consumer-class',
			'id': 'labelled-id',
			'title': 'labelled title',
			'data-qa': 'labelled-qa',
			'data-anything': 'anything',
			'aria-label': 'labelled label',
			'ref': labelledRef,
		});
	},
};

const everyVariation = (
	<div>
		<Divider />
		<Divider variation='danger' />
		<Divider variation='light' flush />
		<Divider vertical />
		<Divider vertical small />
		<Divider vertical stretch flush />
		<Divider small stretch variation='light' />
		<Divider>or</Divider>
		<Divider flush vertical>
			ignored modifiers
		</Divider>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- separator:', '  - text: "or"', '- separator:', '  - text: "ignored modifiers"'].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > hr[0]: rcx-box rcx-box--full rcx-divider',
				'root > div > hr[1]: rcx-box rcx-box--full rcx-divider rcx-divider--danger',
				'root > div > hr[2]: rcx-box rcx-box--full rcx-divider rcx-divider--flush rcx-divider--light',
				'root > div > hr[3]: rcx-box rcx-box--full rcx-divider rcx-divider--vertical',
				'root > div > hr[4]: rcx-box rcx-box--full rcx-divider rcx-divider--small rcx-divider--vertical',
				'root > div > hr[5]: rcx-box rcx-box--full rcx-divider rcx-divider--flush rcx-divider--stretch rcx-divider--vertical',
				'root > div > hr[6]: rcx-box rcx-box--full rcx-divider rcx-divider--light',
				'root > div > div[0]: rcx-box rcx-box--full rcx-divider--labelled',
				'root > div > div[0] > div[0]: rcx-divider__bar',
				'root > div > div[0] > div[1]: rcx-divider__wrapper',
				'root > div > div[0] > div[2]: rcx-divider__bar',
				'root > div > div[1]: rcx-box rcx-box--full rcx-divider--labelled',
				'root > div > div[1] > div[0]: rcx-divider__bar',
				'root > div > div[1] > div[1]: rcx-divider__wrapper',
				'root > div > div[1] > div[2]: rcx-divider__bar',
			].join('\n'),
		);
	},
};
