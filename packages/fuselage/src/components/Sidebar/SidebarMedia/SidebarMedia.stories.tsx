import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Sidebar, SidebarMedia, SidebarMediaTitle, SidebarMediaController, Box, IconButton } from '../..';
import { GenericCallItem } from '../helpers';

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
						<IconButton icon='user-arrow-right' small aria-label='user-forward' />
						<IconButton icon='mic' small aria-label='mic' />
						<IconButton icon='pause-unfilled' small aria-label='pause' />
					</SidebarMediaController>
					<GenericCallItem is='div' />
				</SidebarMedia>
			</Sidebar>
		</Box>
	),
};
