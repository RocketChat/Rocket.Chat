import type { Meta, StoryObj } from '@storybook/react';

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
			usage: `
- Use an \`IconButton\` only when a clear, recognizable icon represents the action and no label is needed, as in toolbars and action bars.
- Pair icon buttons with each other. Beside a \`Button\`, use a \`square\` \`Button\` instead.
- Leave \`variant\` unset for neutral actions. Use \`info\` to lead to relevant resources, \`danger\` for actions with significant consequences, and \`primary\` for actions vital to the main workflow.
- Pass an emoji as \`icon\` only in the emoji picker.
- When the button changes a status and also shows it, without changing its own look, show the icon of the current status: \`bell\` while following a thread, \`bell-off\` while not.
- On a \`mini\` button, use only a \`small\` \`Badge\`.
`,
		},
	},
	argTypes: {
		icon: {
			control: 'text',
			table: { category: 'Content' },
		},
		badge: {
			control: false,
			table: { category: 'Content' },
		},
		badgePosition: {
			control: 'inline-radio',
			options: ['top-end', 'bottom-end'],
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
			table: { category: 'Kind' },
		},
		pressed: {
			control: 'boolean',
			table: { category: 'State' },
		},
		size: {
			control: 'select',
			options: ['mini', 'tiny', 'small', 'medium', 'large'],
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
	parameters: {
		pseudo: variationPseudoStatesWithFocusVisible,
		docs: {
			description: {
				story: 'Neutral, `info`, `danger` and emoji buttons in each interaction state, `pressed` included.',
			},
		},
	},
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
	parameters: {
		pseudo: variationPseudoStatesWithFocusVisible,
		docs: {
			description: {
				story: 'Every variant in each interaction state.',
			},
		},
	},
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
	parameters: {
		docs: {
			description: {
				story: '`color` paints only the glyph; the background stays as `variant` sets it.',
			},
		},
	},
	render: () => (
		<ButtonGroup>
			<IconButton icon='pencil' aria-label='pencil' size='small' color='default' />
			<IconButton icon='trash' aria-label='trash' size='small' color='danger' />
		</ButtonGroup>
	),
};

export const _IconButtonWithBadge: Story = {
	parameters: {
		docs: {
			description: {
				story: 'The count is repeated in `aria-label`, since the badge is hidden from assistive technology.',
			},
		},
	},
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
