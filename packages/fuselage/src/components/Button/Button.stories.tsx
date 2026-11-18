import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { PropsVariationSection, variationPseudoStatesWithFocusVisible } from '../../../.storybook/helpers';
import { Box } from '../Box';
import { ButtonGroup } from '../ButtonGroup';
import { Margins } from '../Margins';
import Button from './Button';

export default {
	title: 'Inputs/Button',
	component: Button,
	parameters: {
		docs: {
			usage: `
- Wrap buttons that sit side by side in a \`ButtonGroup\`; a lone button needs no group.
- In a group, use \`primary\` when the next step is evident and \`secondary\` when it is unclear; one \`primary\` at most.
- Start a destructive flow with a \`secondary-danger\` button and confirm it with a \`danger\` one.
- Don't rely on color alone to signal danger: keep a clear label.
- Add a leading \`icon\` only when it closely represents the action and the label needs visual support.
- Prefer a labelled button to an icon-only one: an icon alone is harder to understand and to reach with assistive technology.
- Don't pair a \`Button\` with an \`IconButton\`; use a \`square\` \`Button\` beside other buttons instead.
- While \`loading\`, keep the label unchanged.
- For in-text navigation, use a link, not a button.

**Labels**

- Lead with a clear verb, followed by a noun for less common actions ("Create channel", not "Create"). Common actions such as "Cancel", "Done", "Close" and "OK" need no noun.
- Use sentence case, and no exclamation marks.
- Keep labels short, but understandable.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
		},
		variant: {
			control: 'select',
			options: ['primary', 'secondary', 'danger', 'secondary-danger', 'warning', 'secondary-warning', 'success', 'secondary-success'],
		},
		size: {
			control: 'select',
			options: ['small', 'medium', 'large'],
		},
		square: {
			control: 'boolean',
			table: { category: 'Shape' },
		},
		compact: {
			control: 'boolean',
			table: { category: 'Shape' },
		},
		icon: {
			control: 'text',
			table: { category: 'Content' },
		},
		loading: {
			control: 'boolean',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		is: {
			control: 'select',
			options: ['button', 'a'],
			table: { category: 'Polymorphism', defaultValue: { summary: 'button' } },
		},
		href: {
			control: 'text',
			description: 'Link target when `is="a"`.',
			table: { category: 'Polymorphism' },
		},
		external: {
			control: 'boolean',
			table: { category: 'Polymorphism' },
		},
		onClick: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
	args: {
		children: 'Button',
		onClick: action('click'),
	},
};

export const Loading: Story = {
	args: {
		loading: true,
		children: 'Button',
		onClick: action('click'),
	},
};

export const LoadingInteraction: Story = {
	args: {
		icon: 'add-user',
	},
	render: (args) => {
		const [isLoading, setIsLoading] = useState(false);
		return (
			<Button {...args} loading={isLoading} onClick={() => setIsLoading(!isLoading)}>
				Button
			</Button>
		);
	},
	parameters: {
		docs: {
			description: {
				story: 'Click the button to see the loading state.',
			},
		},
	},
};

export const Truncated: Story = {
	parameters: {
		docs: {
			description: {
				story: 'A label wider than the space the button gets is cut short with an ellipsis.',
			},
		},
	},
	render: () => (
		<Box maxWidth={160} display='flex' justifyContent='center'>
			<Button onClick={action('click')}>Button with loooooooooooong text</Button>
		</Box>
	),
};

export const Variants: Story = {
	render: () => (
		<Margins all='x8'>
			<ButtonGroup>
				<Button variant='primary'>Primary</Button>
				<Button variant='secondary'>Secondary</Button>
			</ButtonGroup>
			<ButtonGroup>
				<Button variant='danger'>Danger</Button>
				<Button variant='secondary-danger'>Secondary Danger</Button>
			</ButtonGroup>
			<ButtonGroup>
				<Button variant='warning'>Warning</Button>
				<Button variant='secondary-warning'>Secondary Warning</Button>
			</ButtonGroup>
			<ButtonGroup>
				<Button variant='success'>Success</Button>
				<Button variant='secondary-success'>Secondary Success</Button>
			</ButtonGroup>
		</Margins>
	),
};

export const Sizes: Story = {
	render: () => (
		<ButtonGroup>
			<Button size='small'>Small</Button>
			<Button size='medium'>Medium</Button>
			<Button>Default</Button>
			<Button size='large'>Large</Button>
		</ButtonGroup>
	),
};

export const Compact: Story = {
	render: () => (
		<ButtonGroup>
			{['1', '2', '10'].map((label) => (
				<Button key={label} size='small' compact>
					{label}
				</Button>
			))}
		</ButtonGroup>
	),
};

export const AsLink: Story = {
	args: {
		is: 'a',
		href: 'https://rocket.chat',
		external: true,
		children: 'Button',
	},
};

export const States: Story = {
	parameters: {
		pseudo: variationPseudoStatesWithFocusVisible,
		docs: {
			description: {
				story: 'Every variant in each interaction state, at the default size and at `small`.',
			},
		},
	},
	render: () => (
		<>
			<PropsVariationSection
				component={Button}
				common={{ onClick: action('click') }}
				xAxis={{
					default: {},
					hover: {},
					active: {},
					focus: {},
					disabled: { disabled: true },
				}}
				yAxis={{
					'icon + text': {
						children: 'Button',
						icon: 'baloon-text',
					},
					'text': {
						children: 'Button',
					},
					'primary': {
						children: 'Button',
						variant: 'primary',
					},
					'secondary': {
						children: 'Button',
						variant: 'secondary',
					},
					'danger': {
						children: 'Button',
						variant: 'danger',
					},
					'secondary-danger': {
						children: 'Button',
						variant: 'secondary-danger',
					},
					'warning': {
						children: 'Button',
						variant: 'warning',
					},
					'secondary-warning': {
						children: 'Button',
						variant: 'secondary-warning',
					},
					'success': {
						children: 'Button',
						variant: 'success',
					},
					'secondary-success': {
						children: 'Button',
						variant: 'secondary-success',
					},
				}}
			/>
			<PropsVariationSection
				component={Button}
				common={{
					size: 'small',
					onClick: action('click'),
				}}
				xAxis={{
					default: {},
					hover: {},
					active: {},
					focus: {},
					disabled: { disabled: true },
				}}
				yAxis={{
					'icon + text': {
						children: 'Button',
						icon: 'baloon-text',
					},
					'text': {
						children: 'Button',
					},
					'primary': {
						children: 'Button',
						variant: 'primary',
					},
					'secondary': {
						children: 'Button',
						variant: 'secondary',
					},
					'danger': {
						children: 'Button',
						variant: 'danger',
					},
					'secondary-danger': {
						children: 'Button',
						variant: 'secondary-danger',
					},
					'warning': {
						children: 'Button',
						variant: 'warning',
					},
					'secondary-warning': {
						children: 'Button',
						variant: 'secondary-warning',
					},
					'success': {
						children: 'Button',
						variant: 'success',
					},
					'secondary-success': {
						children: 'Button',
						variant: 'secondary-success',
					},
				}}
			/>
		</>
	),
};
