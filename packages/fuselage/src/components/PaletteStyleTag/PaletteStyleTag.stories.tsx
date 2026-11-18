import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import { Button } from '../Button';
import { Card, CardBody, CardCol, CardControls, CardHeader, CardTitle } from '../Card';
import { Divider } from '../Divider';
import { FramedIcon } from '../FramedIcon';
import { ProgressBar } from '../ProgressBar';
import PaletteStyleTag from './PaletteStyleTag';

export default {
	title: 'Layout/PaletteStyleTag',
	component: PaletteStyleTag,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		theme: {
			control: 'select',
			options: ['light', 'dark', 'high-contrast'],
			table: { category: 'Theme', defaultValue: { summary: 'light' } },
		},
		tagId: {
			control: 'text',
			table: {
				category: 'Advanced',
				defaultValue: { summary: 'main-palette' },
			},
		},
		prefix: {
			control: 'text',
			table: {
				category: 'Advanced',
				defaultValue: { summary: '--rcx-color' },
			},
		},
		selector: {
			control: 'text',
			table: { category: 'Advanced', defaultValue: { summary: ':root' } },
		},
		palette: {
			control: 'text',
			table: { category: 'Advanced' },
		},
	},
} satisfies Meta<typeof PaletteStyleTag>;

type Story = StoryObj<typeof PaletteStyleTag>;

export const _PaletteStyleTag: Story = {
	render: (args) => (
		<Box backgroundColor='neutral' padding={24}>
			<PaletteStyleTag {...args} />
			<Card>
				<CardHeader>
					<FramedIcon icon='address-book' />
					<CardTitle variant='h3'>{args.theme} theme</CardTitle>
				</CardHeader>
				<CardBody>
					<CardCol>
						Toggle the theme on Control panel to see the color changes.
						<Divider />
						<ProgressBar percentage={10} variant='danger' />
						<ProgressBar percentage={30} variant='warning' />
						<ProgressBar percentage={75} />
						<ProgressBar percentage={100} variant='success' />
					</CardCol>
				</CardBody>
				<CardControls>
					<Button size='medium'>Default</Button>
					<Button size='medium' variant='primary'>
						Primary
					</Button>
					<Button size='medium' variant='danger'>
						Danger
					</Button>
				</CardControls>
			</Card>
		</Box>
	),
	parameters: {
		docs: {
			description: {
				story: 'Change `theme` in the controls to see the colors change.',
			},
		},
	},
};
