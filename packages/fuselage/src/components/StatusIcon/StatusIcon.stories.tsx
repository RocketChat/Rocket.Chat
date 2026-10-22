import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import StatusIcon from './StatusIcon';

export default {
	title: 'Data Display/StatusIcon',
	component: StatusIcon,
	parameters: {
		docs: {
			description: {
				component:
					'An icon whose colour reports a status — a warning, an error, something muted — rather than following the text beside it.\n\n' +
					'Use a plain `Icon` when the glyph should match its text; it inherits the colour around it.',
			},
		},
	},
	argTypes: {
		name: {
			control: 'text',
			description: 'Name of the icon to render, matching a key from the Fuselage icon set.',
			table: { category: 'Content' },
		},
		status: {
			control: 'select',
			options: ['hint', 'info', 'danger', 'warning', 'success'],
			description: 'The status the icon reports, which sets its colour.',
			table: { category: 'Kind' },
		},
		size: {
			control: 'text',
			description: 'Size of the icon; accepts a Box `width` value (e.g. `x16`, `x20`, `x40`).',
			table: { category: 'Size' },
		},
	},
	args: {
		name: 'warning',
		status: 'danger',
		size: 'x20',
	},
} satisfies Meta<typeof StatusIcon>;

type Story = StoryObj<typeof StatusIcon>;

export const Default: Story = {};

export const Statuses: Story = {
	render: (args) => (
		<Box display='flex' flexDirection='column' gap={8} color='default' fontScale='p2'>
			{(['hint', 'info', 'danger', 'warning', 'success'] as const).map((status) => (
				<Box key={status} display='flex' alignItems='center' gap={4}>
					<StatusIcon {...args} status={status} />
					{status}
				</Box>
			))}
		</Box>
	),
};
