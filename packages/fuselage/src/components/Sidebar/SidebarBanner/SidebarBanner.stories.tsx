import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { SidebarBanner } from './SidebarBanner';
import type { SidebarBannerVariant } from './SidebarBanner';
import { SidebarBannerButton } from './SidebarBannerButton';
import { SidebarBannerLink } from './SidebarBannerLink';
import { Icon } from '../../..';

export default {
	title: 'Navigation/Sidebar/SidebarBanner',
	component: SidebarBanner,
	subcomponents: { SidebarBannerButton, SidebarBannerLink },
	parameters: {
		docs: {
			description: {
				component:
					'A notice at the top of the sidebar.\n\n' +
					'**Rules**\n' +
					'- Put the action in `children`: `SidebarBannerLink` when it navigates, `SidebarBannerButton` when it runs code.\n' +
					'- Pass `closeLabel` with a translated label when the banner is dismissible.',
			},
		},
	},
	args: {
		title: 'You’ve reached the limit of active contacts this month',
		onClose: action('close'),
		children: <SidebarBannerButton onPress={action('action')}>Learn more</SidebarBannerButton>,
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
				<SidebarBanner key={variant} {...args} variant={variant} />
			))}
		</div>
	),
};

export const LinkAction: Story = {
	args: {
		variant: 'info',
		children: (
			<SidebarBannerLink href='https://go.rocket.chat' target='_blank' rel='noopener noreferrer'>
				Learn more
			</SidebarBannerLink>
		),
	},
};

export const ButtonAction: Story = {
	args: {
		variant: 'warning',
		title: 'Your status is offline because presence is disabled',
		children: <SidebarBannerButton onPress={action('open modal')}>Learn more</SidebarBannerButton>,
	},
};

export const WithAddon: Story = {
	args: {
		variant: 'danger',
		addon: <Icon name='warning' size='x24' />,
	},
};

export const CustomCloseLabel: Story = {
	args: {
		variant: 'success',
		closeLabel: 'Dismiss notice',
	},
};
