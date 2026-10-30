import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import {
	Sidebar,
	SidebarAccordion,
	SidebarAccordionItem,
	SidebarBanner,
	SidebarCollapseGroup,
	SidebarFooterContent,
	SidebarItemAction,
	SidebarLink,
	SidebarItemBadge,
	SidebarMedia,
	SidebarMediaTitle,
	SidebarMediaController,
	SidebarListItem,
	SidebarSection,
	SidebarFooter,
} from '.';
import { IconButton, TextInput, Icon, Box } from '../..';
import { SidebarCollapseGroupMenu } from './SidebarCollapseGroupMenu';
import { CondensedItems as Condensed } from './SidebarItem/SidebarItem.stories';
import { GenericNoAvatarItem, MenuTemplate } from './helpers';

export default {
	title: 'Navigation/Sidebar',
	component: Sidebar,
	parameters: {
		docs: {
			description: {
				component:
					'The room-list sidebar — rows for rooms (channels/teams/discussions/DMs) grouped into collapsible categories.\n\n' +
					'**Rules**\n' +
					'- Build a room list from sidebar items grouped under collapsible categories.\n' +
					'- Use the unread status to highlight rooms with new activity; use badges for counts.',
			},
		},
	},
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
	render: (args) => (
		<Box height='90vh' width='x280'>
			<Sidebar {...args}>
				<SidebarBanner
					title='You’ve reached the limit active contacts this month'
					linkText='Learn more'
					linkProps={{ href: '#' }}
					onClick={action('click')}
					addon={<Icon name='warning' color='danger' size='x24' />}
				/>
				<SidebarSection>
					<TextInput endAddon={<Icon name='magnifier' size='x20' />} small placeholder='Search' />
					<IconButton icon='sort' title='Sort' size='medium' />
				</SidebarSection>
				<SidebarAccordion>
					<SidebarAccordionItem
						title='Omnichannel'
						badge={<SidebarItemBadge title='25 unred messages' children={25} variant='primary' />}
						defaultExpanded
					>
						<SidebarLink
							icon='arrow-down-box'
							href='#'
							selected
							badge={<SidebarItemBadge title='12 unread messages' children={12} variant='primary' />}
							menu={<MenuTemplate />}
						>
							All
						</SidebarLink>
						<SidebarLink icon='user' href='#' badge={<SidebarItemBadge title='10 unread messages' children={10} />} menu={<MenuTemplate />}>
							Assigned to me
						</SidebarLink>
						<SidebarLink
							icon='queue'
							href='#'
							badge={<SidebarItemBadge title='3 unread messages' children={3} variant='danger' />}
							menu={<MenuTemplate />}
						>
							Unassigned
						</SidebarLink>
						<SidebarLink icon='pause' href='#' menu={<MenuTemplate />}>
							On hold
						</SidebarLink>
					</SidebarAccordionItem>
					<SidebarAccordionItem
						title='Team chat'
						defaultExpanded={true}
						badge={<SidebarItemBadge title='99+ unread messages' children='99+' variant='danger' />}
					>
						<SidebarCollapseGroup
							title='Favorites'
							defaultExpanded
							badge={<SidebarItemBadge title='99+ unread messages' children='99+' variant='danger' />}
							menu={
								<SidebarCollapseGroupMenu>
									<MenuTemplate />
								</SidebarCollapseGroupMenu>
							}
						>
							{Array.from({ length: 4 }).map((_, i) => (
								<GenericNoAvatarItem key={i} i={i} />
							))}
						</SidebarCollapseGroup>
						<SidebarCollapseGroup
							title='Teams'
							defaultExpanded
							badge={<SidebarItemBadge title='99+ unread messages' children='99+' variant='danger' />}
							menu={
								<SidebarCollapseGroupMenu>
									<MenuTemplate />
								</SidebarCollapseGroupMenu>
							}
						>
							<Condensed />
							<SidebarListItem>
								<SidebarItemAction onClick={action('add team')}>Add team</SidebarItemAction>
							</SidebarListItem>
						</SidebarCollapseGroup>
						<SidebarCollapseGroup
							title='Discussions'
							defaultExpanded
							badge={<SidebarItemBadge title='99+ unread messages' children='99+' variant='danger' />}
							menu={
								<SidebarCollapseGroupMenu>
									<MenuTemplate />
								</SidebarCollapseGroupMenu>
							}
						>
							<Condensed />
							<SidebarListItem>
								<SidebarItemAction onClick={action('add team')}>Add discussion</SidebarItemAction>
							</SidebarListItem>
						</SidebarCollapseGroup>
					</SidebarAccordionItem>
				</SidebarAccordion>
				<SidebarMedia>
					<SidebarMediaTitle>3 calls in queue</SidebarMediaTitle>
					<SidebarMediaController label='Call'>
						<IconButton icon='user-arrow-right' size='small' aria-label='user-forward' />
						<IconButton icon='mic' size='small' aria-label='mic' />
						<IconButton icon='pause-unfilled' size='small' aria-label='pause' />
					</SidebarMediaController>
					{/* <GenericCallItem is='div' /> */}
				</SidebarMedia>
				<SidebarFooter>
					<SidebarFooterContent>Powered by Rocket.Chat</SidebarFooterContent>
					<SidebarFooterContent>
						<Box is='span' color='titles-labels'>
							Free edition
						</Box>
					</SidebarFooterContent>
				</SidebarFooter>
			</Sidebar>
		</Box>
	),
};

export const Collapsed: Story = {
	...Default,
	args: { collapsed: true },
};

export const BannerVariants: Story = {
	render: () => (
		<Box height='90vh' width='x280'>
			<Sidebar>
				{(['default', 'info', 'success', 'warning', 'danger'] as const).map((variant) => (
					<SidebarBanner
						key={variant}
						variant={variant}
						title={`A ${variant} banner`}
						linkText='Learn more'
						linkProps={{ href: '#' }}
						onClose={action('close')}
					/>
				))}
			</Sidebar>
		</Box>
	),
};
