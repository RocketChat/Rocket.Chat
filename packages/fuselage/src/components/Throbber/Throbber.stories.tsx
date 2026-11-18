import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { PropsVariationSection } from '../../../.storybook/helpers';
import { Box } from '../Box';
import { Button } from '../Button';
import Throbber from './Throbber';

export default {
	title: 'Data Display/Throbber',
	component: Throbber,
	parameters: {
		docs: {
			usage: `
- Use it for brief waits of unknown length.
`,
		},
	},
	argTypes: {
		circleCount: {
			control: 'number',
			table: { defaultValue: { summary: '3' } },
		},
		disabled: {
			control: 'boolean',
		},
		inheritColor: {
			control: 'boolean',
		},
	},
} satisfies Meta<typeof Throbber>;

type Story = StoryObj<typeof Throbber>;

export const Default: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const InsideButton: Story = {
	render: () => (
		<Button>
			<Throbber size='x12' />
		</Button>
	),
};

export const InsideButtonInheritColor: Story = {
	render: () => (
		<Box display='flex' gap={4}>
			<Button variant='primary'>
				<Throbber size='x12' inheritColor />
			</Button>
			<Button variant='primary'>
				<Throbber size='x12' inheritColor />
			</Button>
		</Box>
	),
};

export const States: Story = {
	render: () => (
		<PropsVariationSection
			component={Throbber}
			common={{ onClick: action('click') }}
			yAxis={{
				'default': {},
				'3 circles + x40': { circleCount: 3, size: 'x40' },
				'5 circles + x32': { circleCount: 5, size: 'x32' },
				'7 circles + x24': { circleCount: 7, size: 'x24' },
			}}
			xAxis={{
				default: {},
				disabled: { disabled: true },
			}}
		/>
	),
};
