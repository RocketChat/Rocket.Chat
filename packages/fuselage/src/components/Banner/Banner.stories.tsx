import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import { Icon } from '../Icon';
import Banner from './Banner';

export default {
	title: 'Feedback/Banner',
	component: Banner,
	parameters: {
		docs: {
			description: {
				component:
					"A system-level, non-time-based notification fixed at the top of the viewport. Communicates that something happened or is about to happen. Dismissibility depends on the notification's importance.\n\n" +
					'**Rules**\n' +
					'- Use for a whole-window/system condition (e.g. reconnecting, recording consent, blocked permissions) — for inline status tied to specific content use a Callout instead, and for brief action feedback use a Toast.\n' +
					'- Icon and title are mandatory; description is optional.\n' +
					'- Only show the "X of Y notifications" counter and prev/next controls when more than one banner is queued.\n' +
					'- A banner has no action-button slot — if the notification needs a decision, use a Callout instead.',
			},
		},
	},
	argTypes: {
		title: {
			control: 'text',
			description: 'Heading text displayed at the top of the banner.',
			table: { category: 'Content' },
		},
		children: {
			control: 'text',
			description: 'Body content of the banner.',
			table: { category: 'Content' },
		},
		icon: {
			control: false,
			description: 'Icon element displayed before the content when the banner is wide enough.',
			table: { category: 'Content' },
		},
		link: {
			control: 'text',
			description: 'URL rendered as the "more info" link.',
			table: { category: 'Content' },
		},
		linkText: {
			control: 'text',
			description: 'Label of the link rendered when `link` is set.',
			table: { category: 'Content', defaultValue: { summary: 'More info' } },
		},
		linkTarget: {
			control: 'select',
			options: ['_blank', '_self', '_parent', '_top'],
			description: 'Anchor `target` used for the link rendered by `link`.',
			table: { category: 'Content', defaultValue: { summary: '_blank' } },
		},
		variant: {
			control: 'select',
			options: ['neutral', 'info', 'success', 'warning', 'danger'],
			description: 'Color kind of the banner.',
			table: { category: 'Kind', defaultValue: { summary: 'neutral' } },
		},
		inline: {
			control: 'boolean',
			description: 'Renders a more compact, single-line layout.',
			table: { category: 'Layout' },
		},
		actionable: {
			control: 'boolean',
			description: 'Makes the whole banner clickable, invoking `onAction` when activated.',
			table: { category: 'State' },
		},
		closeable: {
			control: 'boolean',
			description: 'Shows a close button that invokes `onClose` when clicked.',
			table: { category: 'State' },
		},
		onAction: {
			control: false,
			description: 'Called when an actionable banner is clicked.',
			table: { category: 'Events' },
		},
		onClose: {
			control: false,
			description: 'Called when the close button is clicked.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Banner>;

type Story = StoryObj<typeof Banner>;

export const _Banner: Story = {
	args: {
		closeable: true,
		icon: <Icon name='info' size={24} />,
		title: 'Sed ut perspiciatis unde',
		onClose: action('close'),
		link: 'https://rocket.chat/',
		children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor',
	},
};

export const Variations: Story = {
	render: () => (
		<>
			<Banner closeable icon={<Icon name='info' size={24} />} title='Sed ut perspiciatis unde' variant='neutral' onClose={action('close')}>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner closeable icon={<Icon name='info' size={24} />} title='Sed ut perspiciatis unde' variant='info' onClose={action('close')}>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner
				closeable
				icon={<Icon name='warning' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='warning'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner closeable icon={<Icon name='ban' size={24} />} title='Sed ut perspiciatis unde' variant='danger' onClose={action('close')}>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner
				closeable
				icon={<Icon name='circle-check' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='success'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
		</>
	),
};

export const Inline: Story = {
	render: () => (
		<>
			<Banner
				inline
				closeable
				icon={<Icon name='info' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='neutral'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner
				inline
				closeable
				icon={<Icon name='info' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='info'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner
				inline
				closeable
				icon={<Icon name='circle-check' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='success'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner
				inline
				closeable
				icon={<Icon name='warning' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='warning'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
			<Banner
				inline
				closeable
				icon={<Icon name='ban' size={24} />}
				title='Sed ut perspiciatis unde'
				variant='danger'
				onClose={action('close')}
			>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
			</Banner>
			<br />
		</>
	),
};

export const Actionable: Story = {
	args: {
		actionable: true,
		closeable: true,
		icon: <Icon name='info' size={24} />,
		title: 'Sed ut perspiciatis unde',
		onAction: action('action'),
		onClose: action('close'),
		children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor',
	},
};
