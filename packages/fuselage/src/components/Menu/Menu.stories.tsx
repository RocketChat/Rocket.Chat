import type { StoryFn, Meta } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import type { MenuItemIconProps } from '.';
import { Menu, MenuItem, MenuSection, MenuSubmenuTrigger, MenuItemColumn, MenuItemContent, MenuItemIcon, MenuItemInput } from '.';
import { Box } from '../Box';
import type { IconButtonProps } from '../Button';
import { IconButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { CheckBox } from '../CheckBox';
import { Icon } from '../Icon';
import { ItemActions, ItemContent, ItemIcon, ItemTitle } from '../Item';
import { NavBarGroup, NavBarItem } from '../NavBar';
import { RadioButton } from '../RadioButton';
import { StatusBullet } from '../StatusBullet';
import { ToggleSwitch } from '../ToggleSwitch';
import type { MenuProps } from './Menu';

export default {
	title: 'Navigation/Menu',
	component: Menu,
	parameters: {
		docs: {
			description: {
				component:
					'Presents the actions a user can take at a given moment — selection or specific functionality.\n\n' +
					'**Rules**\n' +
					'- The item label is mandatory; the trailing element is optional (radio, checkbox, etc.).\n' +
					'- Use title/divider items to structure groups; mark destructive items as danger; disable items that are unavailable.\n' +
					'- A device picker / list of selectable options is a Menu with title groups + radio trailing elements — not hand-built rows.\n' +
					'- Position 4px from the trigger edge on the opening side; align the menu border to the trigger border.',
			},
		},
	},
	decorators: [
		(story) => (
			<Box minHeight={50} height='full' minWidth={100} maxWidth={250} width='full'>
				{story()}
			</Box>
		),
	],
} satisfies Meta<typeof Menu>;

export const Simple: StoryFn<typeof Menu> = (args) => (
	<Menu placement='right-start' title='Simple Menu' {...args}>
		<MenuItem key='1'>Profile</MenuItem>
		<MenuItem key='2'>Chats</MenuItem>
		<MenuItem key='3'>Settings</MenuItem>
	</Menu>
);

export const Complex: StoryFn<typeof Menu> = (args) => (
	<Menu title='Complex Menu' {...args}>
		<MenuItem key='profile' aria-label='Profile'>
			<MenuItemIcon name='user' />
			<MenuItemContent>Profile</MenuItemContent>
		</MenuItem>
		<MenuItem key='chats' aria-label='Chats'>
			<MenuItemIcon name='chat' />
			<MenuItemContent>Chats</MenuItemContent>
		</MenuItem>
		<MenuItem key='settings' aria-label='Settings'>
			<MenuItemIcon name='cog' color='info' />
			<MenuItemContent>Settings</MenuItemContent>
		</MenuItem>
	</Menu>
);
Complex.parameters = {
	docs: {
		description: {
			story:
				'You can use `MenuItem` sub-components to render more complex items, with icons, avatars, text and inputs. The available components are: <br>`MenuItemAvatar` <br>`MenuItemColumn` <br>`MenuItemContent` <br>`MenuItemIcon` <br>`MenuItemInput` <br>`MenuItemSkeleton` <br>`MenuItemTitle`',
		},
	},
};

export const WithSections: StoryFn<typeof Menu> = (args) => (
	<Menu title='Menu with Sections' {...args}>
		<MenuSection title='Styles'>
			<MenuItem key='bold'>Bold</MenuItem>
			<MenuItem key='underline'>Underline</MenuItem>
		</MenuSection>
		<MenuSection>
			<MenuItem key='left'>Left</MenuItem>
			<MenuItem key='middle'>Middle</MenuItem>
			<MenuItem key='right'>Right</MenuItem>
		</MenuSection>
	</Menu>
);
WithSections.parameters = {
	docs: {
		description: {
			story:
				'Use `<MenuSection>` to group the menu items. The `title` prop is optional. If provided, a **title** and a **divider** is added - otherwise, only the divider is added.',
		},
	},
};

export const MenuDisplayExample = (args: Omit<MenuProps<object>, 'children'>) => {
	const [display, setDisplay] = useState('condensed');
	const [avatarDisplay, setAvatarDisplay] = useState(false);
	const [sortBy, setSortBy] = useState('name');
	const [groupByUnread, setGroupByUnread] = useState(false);
	const [groupByFav, setGroupByFav] = useState(false);
	const [groupByTypes, setGroupByTypes] = useState(false);

	return (
		<Menu selectionMode='multiple' placement='top-start' title='Menu Display Example' {...args}>
			<MenuSection title='Display'>
				<MenuItem key='extended'>
					<MenuItemIcon name='extended-view' />
					<MenuItemContent>Extended</MenuItemContent>
					<MenuItemInput>
						<RadioButton onChange={() => setDisplay('extended')} checked={display === 'extended'} />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='medium'>
					<MenuItemIcon name='medium-view' />
					<MenuItemContent>Medium</MenuItemContent>
					<MenuItemInput>
						<RadioButton onChange={() => setDisplay('medium')} checked={display === 'medium'} />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='condensed'>
					<MenuItemIcon name='condensed-view' />
					<MenuItemContent>Condensed</MenuItemContent>
					<MenuItemInput>
						<RadioButton onChange={() => setDisplay('condensed')} checked={display === 'condensed'} />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='avatars'>
					<MenuItemIcon name='user-rounded' />
					<MenuItemContent>Avatars</MenuItemContent>
					<MenuItemInput>
						<Box display='flex' marginInlineEnd={16}>
							<ToggleSwitch onChange={() => setAvatarDisplay(!avatarDisplay)} checked={avatarDisplay} />
						</Box>
					</MenuItemInput>
				</MenuItem>
			</MenuSection>
			<MenuSection title='Sort by'>
				<MenuItem key='activities'>
					<MenuItemIcon name='clock' />
					<MenuItemContent>Activities</MenuItemContent>
					<MenuItemInput>
						<RadioButton onChange={() => setSortBy('activity')} checked={sortBy === 'activity'} />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='name'>
					<MenuItemIcon name='sort-az' />
					<MenuItemContent>Name</MenuItemContent>
					<MenuItemInput>
						<RadioButton onChange={() => setSortBy('alphabetical')} checked={sortBy === 'alphabetical'} />
					</MenuItemInput>
				</MenuItem>
			</MenuSection>
			<MenuSection title='Group by'>
				<MenuItem key='unread'>
					<MenuItemIcon name='flag' />
					<MenuItemContent>Unread</MenuItemContent>
					<MenuItemInput>
						<CheckBox checked={groupByUnread} onChange={() => setGroupByUnread(!groupByUnread)} />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='favorites'>
					<MenuItemIcon name='star' />
					<MenuItemContent>Favorites</MenuItemContent>
					<MenuItemInput>
						<CheckBox checked={groupByFav} onChange={() => setGroupByFav(!groupByFav)} />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='types'>
					<MenuItemIcon name='group-by-type' />
					<MenuItemContent>Types</MenuItemContent>
					<MenuItemInput>
						<CheckBox checked={groupByTypes} onChange={() => setGroupByTypes(!groupByTypes)} />
					</MenuItemInput>
				</MenuItem>
			</MenuSection>
		</Menu>
	);
};

type Item = {
	name: string;
	icon: MenuItemIconProps['name'];
	input?: ReactNode;
	description?: string;
	variant?: string;
};
const GenericMenuItem = ({ item: { icon, name, input } }: { item: Item }) => (
	<>
		{icon && <MenuItemIcon name={icon} />}
		<MenuItemContent>{name}</MenuItemContent>
		{input && <MenuItemInput>{input}</MenuItemInput>}
	</>
);
export const MenuMapGenericItem = () => {
	const [sortBy, setSortBy] = useState('name');

	const [groupByUnread, setGroupByUnread] = useState(false);
	const [groupByFav, setGroupByFav] = useState(false);
	const [groupByTypes, setGroupByTypes] = useState(false);

	const groupByItems: Item[] = [
		{
			name: 'Unread',
			icon: 'flag',
			input: (
				<Box display='flex' marginInline={16}>
					<CheckBox checked={groupByUnread} onChange={() => setGroupByUnread(!groupByUnread)} />
				</Box>
			),
		},
		{
			name: 'favorites',
			icon: 'star',
			description: 'Group by favorites and unread bla bla balaisudhf ioioasdhoaisdf asdifh oaisdhf aosidhf aisdhf aosdihf',
			input: (
				<Box display='flex' marginInline={16}>
					<CheckBox checked={groupByFav} onChange={() => setGroupByFav(!groupByFav)} />
				</Box>
			),
		},
		{
			name: 'Types',
			icon: 'group-by-type',
			input: (
				<Box display='flex' marginInline={16}>
					<CheckBox checked={groupByTypes} onChange={() => setGroupByTypes(!groupByTypes)} />
				</Box>
			),
		},
	];
	const sortByItems: Item[] = [
		{
			name: 'Activities',
			icon: 'clock',
			input: (
				<Box display='flex' marginInline={16}>
					<CheckBox onChange={() => setSortBy('activity')} checked={sortBy === 'activity'} />
				</Box>
			),
		},
		{
			name: 'Name',
			icon: 'sort-az',
			input: (
				<Box display='flex' marginInline={16}>
					<CheckBox onChange={() => setSortBy('alphabetical')} checked={sortBy === 'alphabetical'} />
				</Box>
			),
		},
	];

	return (
		<Menu selectionMode='multiple' title='Menu with mapped items'>
			<MenuSection title='Sort by' items={sortByItems}>
				{(item) => (
					<MenuItem key={item.name}>
						<GenericMenuItem item={item} />
					</MenuItem>
				)}
			</MenuSection>
			<MenuSection title='Group By' items={groupByItems}>
				{(item) => (
					<MenuItem key={item.name}>
						<GenericMenuItem item={item} />
					</MenuItem>
				)}
			</MenuSection>
			<MenuSection items={[{ id: 'delete', name: 'Delete', icon: 'trash', variant: 'danger' }]}>
				{(item) => (
					<MenuItem key={item.id}>
						<GenericMenuItem item={item as any} />
					</MenuItem>
				)}
			</MenuSection>
		</Menu>
	);
};

export const AsNavBarActions = () => (
	<NavBarGroup>
		<NavBarItem icon='user' title='user' />
		<NavBarItem icon='book' title='book' />
		<Menu title='test' is={NavBarItem}>
			<MenuItem>test</MenuItem>
			<MenuItem>test</MenuItem>
			<MenuItem>test</MenuItem>
			<MenuItem>test</MenuItem>
		</Menu>
		<Menu icon='sort' title='sort'>
			<MenuItem>test</MenuItem>
			<MenuItem>test</MenuItem>
			<MenuItem>test</MenuItem>
			<MenuItem>test</MenuItem>
		</Menu>
	</NavBarGroup>
);

export const ControlledOpenState = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Menu isOpen={isOpen} onOpenChange={setIsOpen} title='Controlled Menu'>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
	);
};

export const ItemVariants = () => (
	<Menu title='Item Variants'>
		<MenuSection
			items={[
				{
					id: 'default',
					name: 'Default',
					icon: 'info-circled',
				},
				{
					id: 'success',
					name: 'Success',
					icon: 'circle-check',
					variant: 'success',
				},
				{
					id: 'warning',
					name: 'Warning',
					icon: 'modal-warning',
					variant: 'warning',
				},
				{
					id: 'danger',
					name: 'Danger',
					icon: 'circle-cross',
					variant: 'danger',
				},
			]}
		>
			{(item) => (
				<MenuItem key={item.id}>
					<GenericMenuItem item={item as any} />
				</MenuItem>
			)}
		</MenuSection>
	</Menu>
);

export const Sizes = () => (
	<ButtonGroup>
		<Menu size='large' title='Large Menu'>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
		<Menu size='medium' title='Medium Menu'>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
		<Menu size='small' title='Small Menu'>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
		<Menu size='tiny' title='Tiny Menu'>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
		<Menu size='mini' title='Mini Menu'>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
	</ButtonGroup>
);

const CustomButton = (props: IconButtonProps) => <IconButton {...props} icon='kebab' variant='secondary' size='large' />;

export const WithCustomButton = () => (
	<ButtonGroup>
		<Menu title='using prop customButton' button={<IconButton icon='kebab' variant='secondary' />}>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
		<Menu title='using prop is' is={CustomButton}>
			<MenuItem key='1'>Profile</MenuItem>
			<MenuItem key='2'>Chats</MenuItem>
			<MenuItem key='3'>Settings</MenuItem>
		</Menu>
	</ButtonGroup>
);

export const Scrollable = () => {
	const items = Array.from({ length: 30 }, (_, i) => <MenuItem key={i}>Item {i + 1}</MenuItem>);
	return <Menu title='Scrollable Menu'>{items}</Menu>;
};

export const WithSubmenu: StoryFn<typeof Menu> = (args) => (
	<Menu title='Menu with Submenu' {...args}>
		<MenuItem key='profile'>Profile</MenuItem>
		<MenuItem key='share' title='Share'>
			<MenuItem key='copy-link'>Copy link</MenuItem>
			<MenuItem key='email'>Email</MenuItem>
		</MenuItem>
		<MenuItem key='settings'>Settings</MenuItem>
	</Menu>
);

export const WithRichSubmenuTrigger: StoryFn<typeof Menu> = (args) => (
	<Menu title='Menu with rich submenu triggers' {...args}>
		<MenuItem key='new' aria-label='New'>
			<MenuItemIcon name='plus' />
			<MenuItemContent>New</MenuItemContent>
		</MenuItem>
		<MenuSubmenuTrigger key='move-to'>
			<MenuItem aria-label='Move to'>
				<MenuItemIcon name='folder' />
				<MenuItemContent>Move to…</MenuItemContent>
			</MenuItem>
			<MenuItem key='inbox'>Inbox</MenuItem>
			<MenuItem key='archive'>Archive</MenuItem>
			<MenuSubmenuTrigger key='teams'>
				<MenuItem aria-label='Teams'>
					<MenuItemIcon name='team' />
					<MenuItemContent>Teams…</MenuItemContent>
				</MenuItem>
				<MenuItem key='design'>Design</MenuItem>
				<MenuItem key='engineering'>Engineering</MenuItem>
			</MenuSubmenuTrigger>
		</MenuSubmenuTrigger>
		<MenuItem key='delete' aria-label='Delete'>
			<MenuItemIcon name='trash' />
			<MenuItemContent>Delete</MenuItemContent>
		</MenuItem>
	</Menu>
);
WithRichSubmenuTrigger.args = {
	onAction: action('click'),
};

export const WithItemParts: StoryFn<typeof Menu> = (args) => (
	<Menu title='Preferences' {...args}>
		<MenuSection title='Status'>
			<MenuItem key='online' textValue='Online'>
				<ItemIcon label='Selected'>
					<Icon name='check' size='x20' />
				</ItemIcon>
				<ItemContent>
					<ItemTitle>Online</ItemTitle>
				</ItemContent>
			</MenuItem>
			<MenuItem key='away' textValue='Away'>
				<ItemIcon />
				<ItemContent>
					<ItemTitle>Away</ItemTitle>
				</ItemContent>
			</MenuItem>
		</MenuSection>
		<MenuSection title='Preferences'>
			<MenuItem key='notifications' textValue='Notifications'>
				<ItemIcon>
					<Icon name='bell' size='x20' />
				</ItemIcon>
				<ItemContent>
					<ItemTitle>Notifications</ItemTitle>
				</ItemContent>
				<ItemActions>
					<ToggleSwitch checked onChange={() => undefined} />
				</ItemActions>
			</MenuItem>
			<MenuSubmenuTrigger key='theme' textValue='Theme'>
				<MenuItem>
					<ItemIcon>
						<Icon name='palette' size='x20' />
					</ItemIcon>
					<ItemContent>
						<ItemTitle>Theme</ItemTitle>
					</ItemContent>
				</MenuItem>
				<MenuItem key='light'>Light</MenuItem>
				<MenuItem key='dark'>Dark</MenuItem>
			</MenuSubmenuTrigger>
		</MenuSection>
	</Menu>
);

export const WithItemAliases: StoryFn<typeof Menu> = (args) => (
	<Menu title='Status' {...args}>
		<MenuSection title='Status'>
			<MenuItem key='online' textValue='Online'>
				<MenuItemColumn>
					<StatusBullet status='online' />
				</MenuItemColumn>
				<MenuItemContent>Online</MenuItemContent>
			</MenuItem>
			<MenuItem key='away' textValue='Away'>
				<MenuItemColumn>
					<StatusBullet status='away' />
				</MenuItemColumn>
				<MenuItemContent>Away</MenuItemContent>
			</MenuItem>
		</MenuSection>
		<MenuSection title='Preferences'>
			<MenuItem key='notifications' textValue='Notifications'>
				<MenuItemIcon name='bell' />
				<MenuItemContent title='Notification preferences'>Notifications</MenuItemContent>
				<MenuItemInput>
					<ToggleSwitch checked onChange={() => undefined} />
				</MenuItemInput>
			</MenuItem>
			<MenuItem key='logout' textValue='Logout'>
				<MenuItemColumn />
				<MenuItemContent>Logout</MenuItemContent>
			</MenuItem>
		</MenuSection>
	</Menu>
);
WithItemAliases.parameters = {
	docs: {
		description: {
			story:
				'The `MenuItem*` aliases render `Item` parts, so menus built from them get the same row layout as menus composed from `Item` parts.',
		},
	},
};
