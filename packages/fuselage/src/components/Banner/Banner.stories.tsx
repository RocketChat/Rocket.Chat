import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Icon } from '../Icon';
import Banner from './Banner';

export default {
	title: 'Feedback/Banner',
	component: Banner,
	parameters: {
		docs: {
			usage: `
- Use for a condition that affects the whole window, such as reconnecting, recording consent or blocked permissions. For a status tied to specific content use a \`Callout\`; for brief feedback on an action, a \`ToastBar\`.
- Always set an \`icon\` and a \`title\`; the description (\`children\`) is optional.
- When several banners are queued, show which one of how many it is and controls to move between them; with a single banner, show neither.
- When the notification needs a decision, use a \`Callout\` with \`actions\`: a \`Banner\` has no place for buttons.
`,
		},
	},
	argTypes: {
		title: {
			control: 'text',
			table: { category: 'Content' },
		},
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		icon: {
			control: false,
			table: { category: 'Content' },
		},
		link: {
			control: 'text',
			table: { category: 'Content' },
		},
		linkText: {
			control: 'text',
			table: { category: 'Content', defaultValue: { summary: 'More info' } },
		},
		linkTarget: {
			control: 'select',
			options: ['_blank', '_self', '_parent', '_top'],
			table: { category: 'Content', defaultValue: { summary: '_blank' } },
		},
		variant: {
			control: 'select',
			options: ['neutral', 'info', 'success', 'warning', 'danger'],
			table: { category: 'Kind', defaultValue: { summary: 'neutral' } },
		},
		inline: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		actionable: {
			control: 'boolean',
			table: { category: 'State' },
		},
		closeable: {
			control: 'boolean',
			table: { category: 'State' },
		},
		onAction: {
			control: false,
			table: { category: 'Events' },
		},
		onClose: {
			control: false,
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
