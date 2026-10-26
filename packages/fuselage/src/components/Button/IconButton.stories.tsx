import type { Meta, StoryObj } from '@storybook/react-vite';

import { PropsVariationSection, variationPseudoStatesWithFocusVisible } from '../../../.storybook/helpers';
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
		variant: {
			control: 'select',
			options: [
				'primary',
				'secondary',
				'info',
				'danger',
				'secondary-danger',
				'warning',
				'secondary-warning',
				'success',
				'secondary-success',
			],
			description: 'Visual style of the button.',
			table: { category: 'Kind' },
		},
		pressed: {
			control: 'boolean',
			description: 'Marks the button as pressed/toggled on.',
			table: { category: 'State' },
		},
		size: {
			control: 'select',
			options: ['mini', 'tiny', 'small', 'medium', 'large'],
			description: 'Size scale of the button.',
			table: { category: 'Size', defaultValue: { summary: 'large' } },
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
	parameters: { pseudo: variationPseudoStatesWithFocusVisible },
	render: () => (
		<>
			<PropsVariationSection
				component={IconButton}
				common={{
					'icon': 'doner',
					'size': 'medium',
					'aria-label': 'balloon',
				}}
				xAxis={{
					default: {},
					hover: {},
					active: {},
					focus: {},
					pressed: { pressed: true },
					disabled: { disabled: true },
				}}
				yAxis={{
					default: {},
					info: {
						variant: 'info',
					},
					danger: {
						variant: 'danger',
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
        hover: {},
        active: {},
        focus: {},
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
	parameters: { pseudo: variationPseudoStatesWithFocusVisible },
	render: () => (
		<>
			<PropsVariationSection
				component={IconButton}
				common={{
					'icon': 'doner',
					'size': 'medium',
					'aria-label': 'balloon',
				}}
				xAxis={{
					default: {},
					hover: {},
					active: {},
					focus: {},
					disabled: { disabled: true },
				}}
				yAxis={{
					'default': {},
					'info': {
						variant: 'info',
					},
					'danger': {
						variant: 'danger',
					},
					'success': {
						variant: 'success',
					},
					'warning': {
						variant: 'warning',
					},
					'secondary': {
						variant: 'secondary',
					},
					'secondary-info | primary': {
						variant: 'primary',
					},
					'secondary-danger': {
						variant: 'secondary-danger',
					},
					'secondary-success': {
						variant: 'secondary-success',
					},
					'secondary-warning': {
						variant: 'secondary-warning',
					},
				}}
			/>
		</>
	),
};

export const Sizes: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='balloon' aria-label='balloon' variant='secondary' />
			<IconButton icon='balloon' aria-label='balloon' variant='secondary' size='medium' />
			<IconButton icon='balloon' aria-label='balloon' variant='secondary' size='small' />
			<IconButton icon='balloon' aria-label='balloon' variant='secondary' size='tiny' />
			<IconButton icon='balloon' aria-label='balloon' variant='secondary' size='mini' />
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
		'variant': 'info',
	},
};

export const _IconButtonSecondaryInfo: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'primary',
	},
};

export const _IconButtonSuccess: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'success',
	},
};

export const _IconButtonSecondarySuccess: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'secondary-success',
	},
};

export const _IconButtonWarning: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'warning',
	},
};

export const _IconButtonSecondaryWarning: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'secondary-warning',
	},
};

export const _IconButtonDanger: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'danger',
	},
};

export const _IconButtonSecondaryDanger: Story = {
	args: {
		'icon': 'balloon',
		'aria-label': 'balloon',
		'variant': 'secondary-danger',
	},
};

export const Colors: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='pencil' aria-label='pencil' size='small' color='default' />
			<IconButton icon='trash' aria-label='trash' size='small' color='danger' />
		</ButtonGroup>
	),
};

export const _IconButtonWithBadge: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='balloon' aria-label='balloon, 2 unread messages' size='small' badge={<Badge variant='danger'>2</Badge>} />
		</ButtonGroup>
	),
};

export const _IconButtonAvatarWithBadge: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton
				icon={<Avatar size='x28' url={avatarUrl} />}
				aria-label='profile, 2 unread messages'
				size='small'
				badge={<Badge variant='danger'>2</Badge>}
			/>
		</ButtonGroup>
	),
};

export const _IconButtonWithDot: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton icon='balloon' aria-label='balloon, unread messages' size='small' badge={<Badge variant='danger' small />} />
		</ButtonGroup>
	),
};

export const _IconButtonWithBadgeAtBottom: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton
				icon={<Avatar size='x28' url={avatarUrl} />}
				aria-label='profile, online'
				size='medium'
				badgePosition='bottom-end'
				badge={<Badge variant='primary' small />}
			/>
		</ButtonGroup>
	),
};
