import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Sidepanel, SidepanelSection, SidepanelHeader, SidepanelHeaderTitle, SidepanelList, SidepanelListItem } from '.';
import {
	Avatar,
	Box,
	Icon,
	IconButton,
	InputBox,
	SidebarItemTitle,
	SidebarItemCol,
	SidebarItemBadge,
	SidebarItemIcon,
	SidebarItemMenu,
	SidebarItemContent,
	SidebarItemRow,
	SidebarItem,
	SidebarItemTimestamp,
	Tag,
} from '../..';
import { SidebarItemAvatarWrapper } from '../Sidebar/SidebarItem/SidebarItemAvatarWrapper';
import { MenuTemplate, leterAvatarUrls, names } from '../Sidebar/helpers';

export default {
	title: 'Navigation/Sidepanel',
	component: Sidepanel,
	decorators: [
		(Story) => (
			<Box height='90vh' width='x276'>
				<Story />
			</Box>
		),
	],
	argTypes: {
		children: {
			control: false,
			description: 'Content of the sidepanel.',
		},
	},
} satisfies Meta<typeof Sidepanel>;

type Story = StoryObj<typeof Sidepanel>;

const render: Story['render'] = (args) => (
	<Sidepanel {...args}>
		<SidepanelHeader>
			<SidepanelHeaderTitle>Title Lorem Ipsum Indolor Ipsum Dolor Ipsum Ipsum</SidepanelHeaderTitle>
			<IconButton icon='burger-menu' size='x28' title='menu' />
		</SidepanelHeader>
		<SidepanelSection>
			<InputBox type='text' placeholder='Search' endAddon={<Icon name='magnifier' size='x18' />} />
		</SidepanelSection>
		<Box overflowY='auto' height='full'>
			<SidepanelList>
				{new Array(20).fill(null).map((_, index) => {
					return (
						<SidepanelListItem key={index}>
							<SidebarItem level={2} href='#'>
								<SidebarItemCol>
									<SidebarItemRow>
										<SidebarItemAvatarWrapper>
											<Avatar size='x20' url={leterAvatarUrls[index % 4]} alt='avatar' />
										</SidebarItemAvatarWrapper>
										<SidebarItemIcon highlighted={Boolean(index === 0)} icon='team' />
										<SidebarItemTitle unread={Boolean(index === 0)}>{names[index % 10]}</SidebarItemTitle>
										<SidebarItemTimestamp>11:22:21 AM</SidebarItemTimestamp>
									</SidebarItemRow>
									<SidebarItemRow>
										<SidebarItemContent unread={Boolean(index === 0)}>Lorem Ipsum Indolor Dolor Ipsum Ipsum</SidebarItemContent>
										<Tag role='button' maxWidth='50%' flexShrink={1} flexGrow={0}>
											<Icon size='x12' marginInlineEnd={4} name='team' />
											Team title
										</Tag>
										<SidebarItemBadge title='unread messages'>{index + 3}</SidebarItemBadge>
										<SidebarItemMenu>
											<MenuTemplate />
										</SidebarItemMenu>
									</SidebarItemRow>
								</SidebarItemCol>
							</SidebarItem>
						</SidepanelListItem>
					);
				})}
			</SidepanelList>
		</Box>
	</Sidepanel>
);

export const Default: Story = {
	render,
};
