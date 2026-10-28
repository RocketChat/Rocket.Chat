import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../Avatar';
import { Box } from '../Box';
import { Menu, MenuItem, MenuSection } from '../Menu';
import NavBar from './NavBar';
import NavBarDivider from './NavBarDivider';
import NavBarGroup from './NavBarGroup';
import NavBarItem from './NavBarItem';
import NavBarSection from './NavBarSection';
import { MenuDisplayExample } from '../Menu/Menu.stories';
import { avatarUrl } from '../Message/helpers';

export default {
	title: 'Navigation/Navbar',
	component: NavBar,
	subcomponents: {
		NavBarItem,
		NavBarSection,
		NavBarDivider,
		NavBarGroup,
	},
	decorators: [
		(Story) => (
			<Box display='flex'>
				<Story />
			</Box>
		),
	],
	argTypes: {
		children: {
			control: false,
			description: 'NavBar sections rendered inside the underlying `<nav>` element.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof NavBar>;

type Story = StoryObj<typeof NavBar>;

export const Default: Story = {
	render: (args) => (
		<NavBar {...args}>
			<NavBarSection>
				<NavBarGroup role='toolbar'>
					<NavBarItem icon='home' title='home' />
					<NavBarItem icon='store' title='marketplace' />
					<NavBarItem icon='notebook-hashtag' title='directory' />
					<NavBarItem icon='document-eye' title='audit' />
					<NavBarItem icon='address-book' title='contacts' />
				</NavBarGroup>
				<NavBarGroup role='toolbar'>
					<NavBarItem>
						<MenuDisplayExample size='small' icon='sort' title='sort' />
					</NavBarItem>
					<NavBarItem icon='magnifier' title='search' />
					<Menu icon='pencil-box' size='small' title='create new'>
						<MenuSection title='Create new'>
							<MenuItem key='direct-message'>Direct message</MenuItem>
							<MenuItem key='discussion'>Discussion</MenuItem>
							<MenuItem key='channel'>Channel</MenuItem>
							<MenuItem key='team'>Team</MenuItem>
						</MenuSection>
					</Menu>
				</NavBarGroup>
				<NavBarGroup role='toolbar'>
					<NavBarItem icon='dialpad' title='dialpad' />
					<NavBarItem icon='live' title='live' />
					<NavBarItem icon='phone-disabled' title='phone-disabled' />
					<NavBarItem icon='message-disabled' title='message-disabled' />
				</NavBarGroup>
			</NavBarSection>
			<NavBarSection>
				<NavBarGroup>
					<NavBarItem icon='cog' title='preferences' />
					<NavBarItem>
						<Menu size='small' icon={<Avatar url={avatarUrl} alt='user avatar' size='x28' />} title='profile'>
							<MenuItem key='1'>Profile</MenuItem>
							<MenuItem key='2'>Chats</MenuItem>
							<MenuItem key='3'>Settings</MenuItem>
						</Menu>
					</NavBarItem>
				</NavBarGroup>
			</NavBarSection>
		</NavBar>
	),
};
