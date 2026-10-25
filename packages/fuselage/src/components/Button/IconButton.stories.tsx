import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PropsVariationSection } from '../../../.storybook/helpers';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { ButtonGroup } from '../ButtonGroup';
import IconButton from './IconButton';
import { avatarUrl } from '../Message/helpers';

export default {
	title: 'Inputs/IconButton',
	component: IconButton,
	parameters: {
		docs: {
			description: {
				component:
					'A label-less, icon-only button. More minimalistic than a regular button with text.\n\n' +
					'**Rules**\n' +
					'- Use only when a clear, recognizable icon represents the action and no text label is needed.\n' +
					// '- Do not pair a regular Button with an Icon button — use a regular Button with Icon Only instead, to keep matching properties.\n' +
					// commented out because we shouldn't have icon-only and IconButton as separate components, but rather have IconButton be a variant of Button. This will be aligned with design team and fixed in the future.
					'- When the button indicates a status (not just triggers it), use the icon that reflects the current status (e.g. bell = following, bell-off = not following).\n' +
					"- When paired with a Badge, don't combine mini/tiny icon buttons with large/medium badges.",
			},
		},
	},
	argTypes: {
		icon: {
			control: 'text',
			description: 'Name of the Fuselage icon rendered inside the button, or a custom element.',
			table: { category: 'Content' },
		},
		badge: {
			control: false,
			description:
				'What to pin to the button’s corner, a `Badge` as a rule. It is hidden from assistive technology, so what it says belongs in `aria-label` too.',
			table: { category: 'Content' },
		},
		badgePosition: {
			control: 'inline-radio',
			options: ['top-end', 'bottom-end'],
			description: 'The corner the badge is pinned to.',
			table: { category: 'Content', defaultValue: { summary: 'top-end' } },
		},
		primary: {
			control: 'boolean',
			description: 'Solid, high-emphasis color kind.',
			table: { category: 'Kind' },
		},
		secondary: {
			control: 'boolean',
			description: 'Outlined, lower-emphasis style. Combines with `info`/`danger`/`warning`/`success` for their secondary variants.',
			table: { category: 'Kind' },
		},
		info: {
			control: 'boolean',
			description: 'Informational color kind.',
			table: { category: 'Kind' },
		},
		danger: {
			control: 'boolean',
			description: 'Destructive-action color kind.',
			table: { category: 'Kind' },
		},
		warning: {
			control: 'boolean',
			description: 'Warning color kind.',
			table: { category: 'Kind' },
		},
		success: {
			control: 'boolean',
			description: 'Success color kind.',
			table: { category: 'Kind' },
		},
		pressed: {
			control: 'boolean',
			description: 'Marks the button as pressed/toggled on.',
			table: { category: 'State' },
		},
		large: {
			control: 'boolean',
			description: 'Large size scale.',
			table: { category: 'Size' },
		},
		medium: {
			control: 'boolean',
			description: 'Medium size scale.',
			table: { category: 'Size' },
		},
		small: {
			control: 'boolean',
			description: 'Small size scale.',
			table: { category: 'Size' },
		},
		tiny: {
			control: 'boolean',
			description: 'Tiny size scale.',
			table: { category: 'Size' },
		},
		mini: {
			control: 'boolean',
			description: 'Mini size scale.',
			table: { category: 'Size' },
		},
	},
} satisfies Meta<typeof IconButton>;

type Story = StoryObj<typeof IconButton>;

const EmojiElement = (
	<div className='rcx-box rcx-box--full'>
		<span className='emojione emojione-diversity _1f918-1f3fe' title=':metal_tone4:'>
			🤘🏾
		</span>
	</div>
);

export const _IconButton: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
	},
};

export const States: Story = {
	render: () => (
		<>
			<PropsVariationSection
				component={IconButton}
				common={{
					'icon': 'doner',
					'medium': true,
					'aria-label': 'balloon',
				}}
				xAxis={{
					default: {},
					hover: { className: 'hover' },
					active: { className: 'active' },
					focus: { className: 'focus focus-visible' },
					pressed: { pressed: true },
					disabled: { disabled: true },
				}}
				yAxis={{
					default: {},
					info: {
						info: true,
					},
					danger: {
						danger: true,
					},
					emoji: {
						icon: EmojiElement,
					},
				}}
			/>
			{/* <Divider />
    <PropsVariationSection
      component={IconButton}
      common={{
        icon: 'doner',
        large: true,
      }}
      xAxis={{
        large: {},
        hover: { className: 'hover' },
        active: { className: 'active' },
        focus: { className: 'focus focus-visible' },
        pressed: { pressed: true },
        disabled: { disabled: true },
      }}
      yAxis={{
        default: {
        },
        info: {
          info: true,
        },
        danger: {
          danger: true,
        },
        emoji: {
          icon: EmojiElement,
        },
      }}
    /> */}
		</>
	),
};

export const Variants: Story = {
	render: () => (
		<>
			<PropsVariationSection
				component={IconButton}
				common={{
					'icon': 'doner',
					'medium': true,
					'aria-label': 'balloon',
				}}
				xAxis={{
					default: {},
					hover: { className: 'hover' },
					active: { className: 'active' },
					focus: { className: 'focus focus-visible' },
					disabled: { disabled: true },
				}}
				yAxis={{
					'default': {},
					'info': {
						info: true,
					},
					'danger': {
						danger: true,
					},
					'success': {
						success: true,
					},
					'warning': {
						warning: true,
					},
					'secondary': {
						secondary: true,
					},
					'secondary-info | primary': {
						info: true,
						secondary: true,
					},
					'secondary-danger': {
						danger: true,
						secondary: true,
					},
					'secondary-success': {
						success: true,
						secondary: true,
					},
					'secondary-warning': {
						warning: true,
						secondary: true,
					},
				}}
			/>
		</>
	),
};

export const Sizes: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='balloon' aria-label='balloon' secondary />
			<IconButton icon='balloon' aria-label='balloon' secondary medium />
			<IconButton icon='balloon' aria-label='balloon' secondary small />
			<IconButton icon='balloon' aria-label='balloon' secondary tiny />
			<IconButton icon='balloon' aria-label='balloon' secondary mini />
		</ButtonGroup>
	),
};

export const _IconButtonDisabled: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'disabled': true,
	},
};

export const _IconButtonWithEmoji: Story = {
	args: {
		'icon': EmojiElement,
		'aria-label': 'emoji',
	},
};

export const _IconButtonInfo: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'info': true,
	},
};

export const _IconButtonSecondaryInfo: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'secondary': true,
		'info': true,
	},
};

export const _IconButtonSuccess: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'success': true,
	},
};

export const _IconButtonSecondarySuccess: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'secondary': true,
		'success': true,
	},
};

export const _IconButtonWarning: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'warning': true,
	},
};

export const _IconButtonSecondaryWarning: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'secondary': true,
		'warning': true,
	},
};

export const _IconButtonDanger: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'danger': true,
	},
};

export const _IconButtonSecondaryDanger: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'secondary': true,
		'danger': true,
	},
};

export const Colors: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='pencil' aria-label='pencil' small color='default' />
			<IconButton icon='trash' aria-label='trash' small color='danger' />
		</ButtonGroup>
	),
};

export const _IconButtonWithBadge: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='balloon' aria-label='balloon, 2 unread messages' small badge={<Badge variant='danger'>2</Badge>} />
		</ButtonGroup>
	),
};

export const _IconButtonAvatarWithBadge: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton
				icon={<Avatar size='x28' url={avatarUrl} />}
				aria-label='profile, 2 unread messages'
				small
				badge={<Badge variant='danger'>2</Badge>}
			/>
		</ButtonGroup>
	),
};

export const _IconButtonWithDot: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='balloon' aria-label='balloon, unread messages' small badge={<Badge variant='danger' small />} />
		</ButtonGroup>
	),
};

export const _IconButtonWithBadgeAtBottom: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton
				icon={<Avatar size='x28' url={avatarUrl} />}
				aria-label='profile, online'
				medium
				badgePosition='bottom-end'
				badge={<Badge variant='primary' small />}
			/>
		</ButtonGroup>
	),
};
