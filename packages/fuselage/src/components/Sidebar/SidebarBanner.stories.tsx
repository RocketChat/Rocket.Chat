import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { action } from 'storybook/actions';

import { SidebarBanner } from './SidebarBanner';
import type { SidebarBannerVariant } from './SidebarBanner';
import { Icon } from '../..';

export default {
	title: 'Navigation/Sidebar/SidebarBanner',
	component: SidebarBanner,
	parameters: {
		docs: {
			description: {
				component:
					'A notice at the top of the sidebar.\n\n' +
					'**Rules**\n' +
					'- Pass `linkProps.href` when the action navigates: it renders a link. Without an `href` the action renders a button, so it is reachable and operable from the keyboard.\n' +
					'- Pass `closeLabel` with a translated label when the banner is dismissible.',
			},
		},
	},
	args: {
		title: 'You’ve reached the limit of active contacts this month',
		linkText: 'Learn more',
		onClose: action('close'),
	},
	decorators: [
		(Story) => (
			<div style={{ width: 280 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SidebarBanner>;

type Story = StoryObj<typeof SidebarBanner>;

const variants: SidebarBannerVariant[] = ['default', 'info', 'success', 'warning', 'danger'];

export const Variants: Story = {
	render: (args) => (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
			{variants.map((variant) => (
				<SidebarBanner key={variant} {...args} variant={variant} linkProps={{ onClick: action(`action ${variant}`) }} />
			))}
		</div>
	),
};

export const LinkAction: Story = {
	args: {
		variant: 'info',
		linkProps: { href: 'https://go.rocket.chat', target: '_blank', rel: 'noopener noreferrer' },
	},
};

export const ButtonAction: Story = {
	args: {
		variant: 'warning',
		title: 'Your status is offline because presence is disabled',
		linkText: 'Learn more',
		linkProps: { onClick: action('open modal') },
	},
};

export const WithAddon: Story = {
	args: {
		variant: 'danger',
		linkProps: { onClick: action('action') },
		addon: <Icon name='warning' size='x24' />,
	},
};

export const CustomCloseLabel: Story = {
	args: {
		variant: 'success',
		closeLabel: 'Dismiss notice',
		linkProps: { onClick: action('action') },
	},
};

// Each variant's background hook is overridden; the text keeps its own hook instead of turning the background colour.
const backgroundOverrides = {
	'--rcx-sidebar-banner-background-default': '#f2f3f5',
	'--rcx-sidebar-banner-background-info': '#dbe8ff',
	'--rcx-sidebar-banner-background-success': '#d6f5e3',
	'--rcx-sidebar-banner-background-warning': '#fff0c7',
	'--rcx-sidebar-banner-background-danger': '#ffdde0',
} as CSSProperties;

export const CustomBackgroundHooks: Story = {
	render: (args) => (
		<div style={{ ...backgroundOverrides, display: 'flex', flexDirection: 'column', gap: 8 }}>
			{variants.map((variant) => (
				<SidebarBanner key={variant} {...args} variant={variant} linkProps={{ onClick: action(`action ${variant}`) }} />
			))}
		</div>
	),
};
