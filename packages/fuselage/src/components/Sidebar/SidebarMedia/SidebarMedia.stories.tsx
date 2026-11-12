import type { Meta, StoryObj } from '@storybook/react';

import { Sidebar, SidebarMedia, SidebarMediaTitle, SidebarMediaController, Box, IconButton } from '../../index.js';
import { GenericCallItem } from '../helpers.js';

export default {
	title: 'Navigation/Sidebar/Media',
	component: Sidebar,
	argTypes: {
		collapsed: {
			control: 'boolean',
			description: 'Renders the sidebar in its collapsed (narrow) state.',
		},
		children: {
			control: false,
			description: 'Content of the sidebar.',
		},
	},
} satisfies Meta<typeof Sidebar>;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
	render: () => (
		<Box>
			<Sidebar>
				<SidebarMedia>
					<SidebarMediaTitle>3 calls in queue</SidebarMediaTitle>
					<SidebarMediaController label='Call'>
						<IconButton icon='user-arrow-right' size='small' aria-label='user-forward' />
						<IconButton icon='mic' size='small' aria-label='mic' />
						<IconButton icon='pause-unfilled' size='small' aria-label='pause' />
					</SidebarMediaController>
					<GenericCallItem is='div' />
				</SidebarMedia>
			</Sidebar>
		</Box>
	),
};
