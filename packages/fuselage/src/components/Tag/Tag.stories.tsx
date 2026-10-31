import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { Box } from '../Box';
import { ButtonGroup } from '../ButtonGroup';
import { Icon } from '../Icon';
import Tag from './Tag';

export default {
	title: 'Data Display/Tag',
	component: Tag,
	parameters: {
		docs: {
			description: {
				component:
					'A quickly recognizable component used to display set values.\n\n' +
					'**Rules**\n' +
					'- Use the Primary type sparingly — it draws the most attention.\n' +
					'- A leading icon helps recognition and lowers cognitive load — add only when it clarifies the tag.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Tag label content.',
		},
		variant: {
			control: 'select',
			options: ['primary', 'secondary', 'danger', 'warning', 'secondary-danger', 'secondary-warning', 'secondary-info', 'featured'],
			description: 'Color kind applied to the tag.',
		},
		medium: {
			control: 'boolean',
			description: 'Medium size scale.',
			table: { category: 'Size' },
		},
		large: {
			control: 'boolean',
			description: 'Large size scale.',
			table: { category: 'Size' },
		},
		pill: {
			control: 'boolean',
			description: 'Fully rounded shape. Use for interactive tags such as filters.',
			table: { category: 'Shape' },
		},
		disabled: {
			control: 'boolean',
			description: 'Renders the disabled visual style.',
			table: { category: 'State' },
		},
		icon: {
			control: false,
			description: 'Element rendered before the tag label.',
			table: { category: 'Content' },
		},
		href: {
			control: 'text',
			description: 'Renders the tag as a link to this address.',
			table: { category: 'Polymorphism' },
		},
		is: {
			control: 'select',
			options: ['span', 'a', 'button'],
			description:
				'Element to render. Defaults to `a` with `href` and `span` otherwise; `button` makes a tag that acts, such as a filter toggled with `aria-pressed`.',
			table: { category: 'Polymorphism' },
		},
		onClick: {
			control: false,
			description: 'Called when the tag is clicked; also marks it as clickable.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Tag>;

type Story = StoryObj<typeof Tag>;

const render: Story['render'] = (args) => (
	<Box display='inline-flex'>
		<Tag {...args}>{args.children || 'john.doe'}</Tag>
	</Box>
);

export const Default: Story = {
	render,
};

export const _Primary: Story = {
	render,
	args: {
		variant: 'primary',
	},
};

export const Secondary: Story = {
	render,
	args: {
		variant: 'secondary',
	},
};

export const _Danger: Story = {
	render,
	args: {
		variant: 'danger',
	},
};

export const Warning: Story = {
	render,
	args: {
		variant: 'warning',
	},
};

export const Featured: Story = {
	render,
	args: {
		variant: 'featured',
	},
};

export const _SecondaryDanger: Story = {
	render,
	args: {
		variant: 'secondary-danger',
	},
};

export const _SecondaryWarning: Story = {
	render,
	args: {
		variant: 'secondary-warning',
	},
};

export const _SecondaryInfo: Story = {
	render,
	args: {
		variant: 'secondary-info',
	},
};

export const WithIcon: Story = {
	render,
	args: {
		icon: <Icon size='x12' name='team-lock' />,
		children: 'Team',
	},
};

export const Disabled: Story = {
	render,
	args: {
		disabled: true,
	},
};

export const Clickable: Story = {
	render,
	args: {
		onClick: action('click'),
	},
};

export const Medium: Story = {
	render,
	args: {
		medium: true,
	},
};

export const Large: Story = {
	render,
	args: {
		large: true,
	},
};

export const Pill: Story = {
	render,
	args: {
		pill: true,
		variant: 'secondary-info',
		onClick: action('click'),
	},
};

const ToggleFilter = () => {
	const [pressed, setPressed] = useState(true);

	return (
		<Box display='inline-flex'>
			<Tag
				is='button'
				pill
				variant={pressed ? 'secondary-info' : 'secondary'}
				icon={<Icon name='clock' size='x12' />}
				aria-pressed={pressed}
				onClick={() => setPressed((value) => !value)}
			>
				7 days
			</Tag>
		</Box>
	);
};

export const AsToggleButton: Story = {
	render: () => <ToggleFilter />,
	parameters: {
		docs: {
			description: {
				story:
					"A filter the user turns on and off: `is='button'` renders a `<button>` and `aria-pressed` tells assistive technology its state. The caller picks the variant for each state.",
			},
		},
	},
};

export const AsLink: Story = {
	render,
	args: {
		href: '#',
	},
};

const variants = [
	undefined,
	'primary',
	'secondary',
	'danger',
	'warning',
	'featured',
	'secondary-danger',
	'secondary-warning',
	'secondary-info',
] as const;

const sizes = [
	{ label: 'Default size', props: {} },
	{ label: 'Medium', props: { medium: true } },
	{ label: 'Large', props: { large: true } },
];

export const Variants: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' gap='x16'>
			{[false, true].map((pill) =>
				sizes.map(({ label, props }) =>
					[false, true].map((withIcon) => {
						const title = [pill ? 'Pill' : 'Default radius', label, withIcon ? 'With icon' : 'Without icon'].join(' · ');

						return (
							<Box key={title} display='flex' flexDirection='column' gap='x4'>
								<Box fontScale='c2' color='default'>
									{title}
								</Box>
								<ButtonGroup wrap>
									{variants.map((variant) => (
										<Tag
											key={variant ?? 'default'}
											pill={pill}
											variant={variant}
											icon={withIcon ? <Icon size='x12' name='team-lock' /> : undefined}
											{...props}
										>
											john.doe
										</Tag>
									))}
								</ButtonGroup>
							</Box>
						);
					}),
				),
			)}
		</Box>
	),
};

export const VariantsAsLinks: Story = {
	render: () => (
		<ButtonGroup>
			<Tag href='#'>john.doe</Tag>
			<Tag variant='primary' href='#'>
				john.doe
			</Tag>
			<Tag variant='danger' href='#'>
				john.doe
			</Tag>
			<Tag variant='warning' href='#'>
				john.doe
			</Tag>
			<Tag variant='featured' href='#'>
				john.doe
			</Tag>
			<Tag variant='secondary-danger' href='#'>
				john.doe
			</Tag>
			<Tag variant='secondary-warning' href='#'>
				john.doe
			</Tag>
			<Tag variant='secondary-info' href='#'>
				john.doe
			</Tag>
		</ButtonGroup>
	),
};
