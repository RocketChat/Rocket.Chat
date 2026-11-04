import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
			description: 'Theme whose palette is rendered as CSS custom properties.',
			table: { category: 'Theme', defaultValue: { summary: 'light' } },
		},
		tagId: {
			control: 'text',
			description: 'Id of the style tag element the palette CSS is written to.',
			table: {
				category: 'Advanced',
				defaultValue: { summary: 'main-palette' },
			},
		},
		prefix: {
			control: 'text',
			description: 'Prefix used for the generated CSS custom property names.',
			table: {
				category: 'Advanced',
				defaultValue: { summary: '--rcx-color' },
			},
		},
		selector: {
			control: 'text',
			description: 'CSS selector the generated custom properties are scoped to.',
			table: { category: 'Advanced', defaultValue: { summary: ':root' } },
		},
		palette: {
			control: 'text',
			description: 'Custom palette CSS to use instead of the one generated from `theme`.',
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
				story: 'Another description on the story, overriding the comments',
			},
		},
	},
};
