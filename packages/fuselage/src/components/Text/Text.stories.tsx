import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from '../Stack';
import Text, { type TextColor, type TextFontScale } from './Text';

const fontScales: TextFontScale[] = ['hero', 'h1', 'h2', 'h3', 'h4', 'h5', 'p1', 'p1m', 'p1b', 'p2', 'p2m', 'p2b', 'c1', 'c2', 'micro'];

const colors: TextColor[] = [
	'default',
	'titles-labels',
	'hint',
	'annotation',
	'secondary-info',
	'info',
	'danger',
	'disabled',
	'status-font-on-info',
	'status-font-on-success',
	'status-font-on-warning',
	'status-font-on-warning-2',
	'status-font-on-danger',
	'status-font-on-service-1',
	'status-font-on-service-2',
];

export default {
	title: 'Data Display/Text',
	component: Text,
	parameters: {
		docs: {
			description: {
				component:
					'Text set in one of the font scales and text colours of the design system. It takes no `Box` styling props: the space around it belongs to its container, usually a `Stack` with a `gap`.\n\n' +
					'Pass `is` when the text has a role: `h2` for a section title, `p` for a paragraph, `label` for a form label. Without it, `Text` renders a `div`.',
			},
		},
	},
	argTypes: {
		is: {
			control: 'select',
			options: [
				'div',
				'span',
				'p',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'label',
				'legend',
				'strong',
				'em',
				'small',
				'time',
				'dt',
				'dd',
				'li',
				'figcaption',
			],
			table: { defaultValue: { summary: 'div' } },
		},
		fontScale: { control: 'select', options: fontScales },
		color: { control: 'select', options: colors },
		truncate: { control: 'boolean' },
	},
	args: {
		children: 'The quick brown fox jumps over the lazy dog',
	},
} satisfies Meta<typeof Text>;

type Story = StoryObj<typeof Text>;

export const Default: Story = {};

export const FontScales: Story = {
	render: (args) => (
		<Stack gap='x8'>
			{fontScales.map((fontScale) => (
				<Text key={fontScale} {...args} fontScale={fontScale}>
					{fontScale}: {args.children}
				</Text>
			))}
		</Stack>
	),
};

export const Colors: Story = {
	render: (args) => (
		<Stack gap='x8'>
			{colors.map((color) => (
				<Text key={color} {...args} fontScale='p2' color={color}>
					{color}: {args.children}
				</Text>
			))}
		</Stack>
	),
};

export const Truncate: Story = {
	render: (args) => (
		<div style={{ width: 200 }}>
			<Text {...args} fontScale='p2' truncate />
		</div>
	),
};

export const Semantic: Story = {
	render: () => (
		<Stack gap='x8'>
			<Text is='h2' fontScale='h4' color='titles-labels'>
				Section title
			</Text>
			<Text is='p' fontScale='p2' color='default'>
				A paragraph under the title.
			</Text>
			<Text is='small' fontScale='c1' color='hint'>
				A hint about the paragraph.
			</Text>
		</Stack>
	),
};
