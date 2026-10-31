import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Box } from '../Box';
import { IconButton } from '../Button';
import { Chevron } from '../Chevron';
import { Icon, type IconProps } from '../Icon';
import { Menu, MenuItem } from '../Menu';
import { leterAvatarUrls } from '../Sidebar/helpers';
import { StatusBullet, type StatusBulletProps } from '../StatusBullet';
import Item from './Item';
import ItemActions from './ItemActions';
import ItemContent from './ItemContent';
import ItemDescription from './ItemDescription';
import ItemDivider from './ItemDivider';
import ItemGroup from './ItemGroup';
import ItemGroupHeader from './ItemGroupHeader';
import ItemGroupTitle from './ItemGroupTitle';
import ItemIcon from './ItemIcon';
import ItemLink from './ItemLink';
import ItemMedia from './ItemMedia';
import ItemMeta from './ItemMeta';
import ItemRow from './ItemRow';
import ItemSkeleton from './ItemSkeleton';
import ItemTitle from './ItemTitle';
import type { ItemInset } from './types';

export default {
	title: 'Navigation/Item',
	component: Item,
	subcomponents: {
		ItemGroup,
		ItemGroupHeader,
		ItemGroupTitle,
		ItemMedia,
		ItemIcon,
		ItemContent,
		ItemRow,
		ItemTitle,
		ItemDescription,
		ItemMeta,
		ItemActions,
		ItemLink,
		ItemDivider,
		ItemSkeleton,
	},
	parameters: {
		docs: {
			description: {
				component:
					'A composable list row for the sidebar, search results, contextual bar lists, menus and selects.\n\n' +
					'**Rules**\n' +
					'- Compose rows from slots. A slot that is absent takes no space.\n' +
					'- Parts render a `div` and set no role. Pass `is`, `role` and ARIA attributes to fit the list pattern: `ul`/`li` for lists, `listbox`/`option` for pickers.\n' +
					'- Use `ItemLink` for the primary target, so actions sit beside the link instead of inside it.\n' +
					'- The row height follows its content: the taller of the media and the text lines. Size the avatar to set it.\n' +
					'- Use `inset` to align rows with their container gutter.\n' +
					'- Collapsing a group belongs to the component that owns it. `ItemGroupHeader` only shows text.',
			},
		},
		layout: 'padded',
		controls: { hideNoControlsWarning: true },
	},
	argTypes: {
		inset: {
			control: 'inline-radio',
			options: ['none', 'sm', 'md', 'lg'],
			description: 'Adds space between the row edge and its first and last slots.',
			table: { category: 'Layout', defaultValue: { summary: 'none' } },
		},
		selected: {
			control: 'boolean',
			table: { category: 'State' },
		},
		highlighted: {
			control: 'boolean',
			description: 'Emphasizes the row, as for unread rooms.',
			table: { category: 'State' },
		},
		focused: {
			control: 'boolean',
			description: 'Shows the hover surface for a virtual cursor.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		variant: {
			control: 'inline-radio',
			options: [undefined, 'danger'],
			table: { category: 'Kind' },
		},
		is: { control: false },
		children: { control: false },
	},
} satisfies Meta<typeof Item>;

type Story = StoryObj<typeof Item>;

type RoomType = 'channel' | 'private' | 'team' | 'discussion';

const roomTypeIcons: Record<RoomType, IconProps['name']> = {
	channel: 'hashtag',
	private: 'hashtag-lock',
	team: 'team',
	discussion: 'discussion',
};

const roomTypeLabels: Record<RoomType, string> = {
	channel: 'Public channel',
	private: 'Private channel',
	team: 'Team',
	discussion: 'Discussion',
};

const statusLabels: Record<NonNullable<StatusBulletProps['status']>, string> = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline',
	disabled: 'Disabled',
	loading: 'Loading',
};

type Room = {
	id: string;
	name: string;
	avatar: number;
	type?: RoomType;
	status?: StatusBulletProps['status'];
	time: string;
	preview: string;
	unread?: number;
	mention?: boolean;
};

const rooms: Room[] = [
	{
		id: 'general',
		name: 'general',
		avatar: 1,
		type: 'channel',
		time: '09:15',
		preview: 'Rafael: release notes for 8.2 are up',
		unread: 12,
	},
	{
		id: 'design-system',
		name: 'design-system',
		avatar: 2,
		type: 'team',
		time: '10:42',
		preview: 'Júlia: pushed the new Item stories to review',
		unread: 3,
	},
	{
		id: 'ops-oncall',
		name: 'ops-oncall',
		avatar: 3,
		type: 'private',
		time: 'Mon',
		preview: 'Incident #4812 resolved',
		unread: 1,
		mention: true,
	},
	{
		id: 'qa-release',
		name: 'qa-release',
		avatar: 0,
		type: 'channel',
		time: 'Sep 20',
		preview: 'Sam: regression run for 8.2.0-rc.3 passed',
	},
	{
		id: 'kenji',
		name: 'Kenji Takahashi',
		avatar: 0,
		status: 'away',
		time: 'Yesterday',
		preview: 'You: sounds good, merging after CI',
	},
	{
		id: 'mariana',
		name: 'Mariana Kovač',
		avatar: 1,
		status: 'online',
		time: '11:08',
		preview: 'Can you check the spacing in the Figma file?',
		unread: 1,
	},
	{
		id: 'priya',
		name: 'Priya Nair',
		avatar: 2,
		status: 'offline',
		time: 'Sep 18',
		preview: 'Priya: see you at the offsite',
	},
	{
		id: 'item-api',
		name: 'Item API review',
		avatar: 3,
		type: 'discussion',
		time: 'Sep 26',
		preview: 'Kenji: do we still need ItemRow?',
		unread: 4,
	},
];

const RoomIcon = ({ room }: { room: Room }) =>
	room.status ? (
		<ItemIcon label={statusLabels[room.status]}>
			<StatusBullet status={room.status} />
		</ItemIcon>
	) : (
		<ItemIcon label={roomTypeLabels[room.type ?? 'channel']}>
			<Icon name={roomTypeIcons[room.type ?? 'channel']} size='x16' />
		</ItemIcon>
	);

const RoomBadge = ({ room }: { room: Room }) =>
	room.unread ? (
		<Badge variant={room.mention ? 'danger' : 'primary'} title={`${room.unread} unread messages`}>
			{room.unread}
		</Badge>
	) : null;

const RoomMenu = ({ room }: { room: Room }) => (
	<Menu mini aria-label={`Options for ${room.name}`} title='Options'>
		<MenuItem key='hide'>Hide</MenuItem>
		<MenuItem key='read'>Mark as read</MenuItem>
		<MenuItem key='favorite'>Favorite</MenuItem>
	</Menu>
);

type ViewMode = 'condensed' | 'medium' | 'extended';

const viewModeAvatarSize = {
	condensed: 'x20',
	medium: 'x28',
	extended: 'x36',
} as const;

type RoomRowProps = {
	room: Room;
	viewMode?: ViewMode;
	inset?: ItemInset;
	selected?: boolean;
};

const RoomRow = ({ room, viewMode = 'condensed', inset, selected }: RoomRowProps) => {
	const extended = viewMode === 'extended';

	return (
		<Item is='li' inset={inset} selected={selected} highlighted={!!room.unread}>
			<ItemMedia>
				<Avatar size={viewModeAvatarSize[viewMode]} url={leterAvatarUrls[room.avatar]} alt='' />
			</ItemMedia>
			<ItemContent>
				<ItemRow>
					<RoomIcon room={room} />
					<ItemTitle>
						<ItemLink href={`#${room.id}`} aria-current={selected ? 'page' : undefined}>
							{room.name}
						</ItemLink>
					</ItemTitle>
					{extended && <ItemMeta>{room.time}</ItemMeta>}
				</ItemRow>
				{extended && (
					<ItemRow>
						<ItemDescription>{room.preview}</ItemDescription>
						<RoomBadge room={room} />
						<ItemActions reveal='hover'>
							<RoomMenu room={room} />
						</ItemActions>
					</ItemRow>
				)}
			</ItemContent>
			{!extended && <RoomBadge room={room} />}
			{!extended && (
				<ItemActions reveal='hover'>
					<RoomMenu room={room} />
				</ItemActions>
			)}
		</Item>
	);
};

const SidebarSurface = ({ children }: { children: ReactNode }) => (
	<Box backgroundColor='sidebar' width='x280' paddingBlock={8} paddingInline={4} borderRadius='medium'>
		{children}
	</Box>
);

const Caption = ({ children }: { children: ReactNode }) => (
	<Box fontScale='c2' color='hint' marginBlock={8}>
		{children}
	</Box>
);

export const Default: Story = {
	args: {
		inset: 'none',
		highlighted: true,
	},
	render: (args) => (
		<SidebarSurface>
			<ItemGroup is='ul' aria-label='Rooms'>
				<Item is='li' {...args}>
					<ItemMedia>
						<Avatar size='x36' url={leterAvatarUrls[2]} alt='' />
					</ItemMedia>
					<ItemContent>
						<ItemRow>
							<ItemIcon label='Team'>
								<Icon name='team' size='x16' />
							</ItemIcon>
							<ItemTitle>
								<ItemLink href='#design-system'>design-system</ItemLink>
							</ItemTitle>
							<ItemMeta>10:42</ItemMeta>
						</ItemRow>
						<ItemRow>
							<ItemDescription>Júlia: pushed the new Item stories to review</ItemDescription>
							<Badge variant='primary' title='3 unread messages'>
								3
							</Badge>
							<ItemActions reveal='hover'>
								<IconButton size='mini' icon='kebab' aria-label='Options' />
							</ItemActions>
						</ItemRow>
					</ItemContent>
				</Item>
			</ItemGroup>
		</SidebarSurface>
	),
};

export const Heights: Story = {
	render: () => (
		<Box display='flex' flexDirection='column'>
			{(['condensed', 'medium', 'extended'] as const).map((viewMode) => (
				<div key={viewMode}>
					<Caption>{viewMode}</Caption>
					<SidebarSurface>
						<ItemGroup is='ul' aria-label={`${viewMode} rooms`}>
							<RoomRow room={rooms[0]} viewMode={viewMode} />
							<RoomRow room={rooms[4]} viewMode={viewMode} />
						</ItemGroup>
					</SidebarSurface>
				</div>
			))}
		</Box>
	),
};

export const Insets: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x400'>
			{(['none', 'sm', 'md', 'lg'] as const).map((inset) => (
				<div key={inset}>
					<Caption>inset {inset}</Caption>
					<Box borderWidth='default' borderColor='extra-light'>
						<ItemGroup is='ul' aria-label={`Inset ${inset}`}>
							<Item is='li' inset={inset}>
								<ItemMedia>
									<Avatar size='x28' url={leterAvatarUrls[1]} alt='' />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										<ItemLink is='button'>Mariana Kovač</ItemLink>
									</ItemTitle>
								</ItemContent>
								<ItemActions>
									<IconButton size='small' icon='kebab' aria-label='Actions for Mariana Kovač' />
								</ItemActions>
							</Item>
						</ItemGroup>
					</Box>
				</div>
			))}
		</Box>
	),
};

export const States: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x280'>
			<Caption>Rows</Caption>
			<SidebarSurface>
				<ItemGroup is='ul' aria-label='Row states'>
					<RoomRow room={rooms[3]} />
					<RoomRow room={rooms[3]} selected />
					<RoomRow room={rooms[1]} />
				</ItemGroup>
			</SidebarSurface>
			<Caption>Options and menu items</Caption>
			<ItemGroup role='menu' aria-label='Option states'>
				<Item role='menuitem' tabIndex={-1} inset='md' focused>
					<ItemMedia variant='icon'>
						<Icon name='star' size='x20' />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Favorite (focused)</ItemTitle>
					</ItemContent>
				</Item>
				<Item role='menuitem' tabIndex={-1} inset='md' disabled aria-disabled='true'>
					<ItemMedia variant='icon'>
						<Icon name='bell-off' size='x20' />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Mute notifications (disabled)</ItemTitle>
					</ItemContent>
				</Item>
				<Item role='menuitem' tabIndex={-1} inset='md' variant='danger'>
					<ItemMedia variant='icon'>
						<Icon name='trash' size='x20' />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Leave room (danger)</ItemTitle>
					</ItemContent>
				</Item>
			</ItemGroup>
		</Box>
	),
};

export const Actions: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x280'>
			<Caption>reveal=&quot;always&quot;</Caption>
			<SidebarSurface>
				<ItemGroup is='ul' aria-label='Always visible actions'>
					<Item is='li'>
						<ItemMedia>
							<Avatar size='x20' url={leterAvatarUrls[3]} alt='' />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<ItemLink href='#ops-oncall'>ops-oncall</ItemLink>
							</ItemTitle>
						</ItemContent>
						<ItemActions>
							<IconButton size='mini' icon='phone' aria-label='Join call in ops-oncall' />
							<IconButton size='mini' icon='kebab' aria-label='Options for ops-oncall' />
						</ItemActions>
					</Item>
				</ItemGroup>
			</SidebarSurface>
			<Caption>reveal=&quot;always&quot;, inside an ItemRow</Caption>
			<ItemGroup is='ul' aria-label='Always visible actions on the second line'>
				<Item is='li' inset='md'>
					<ItemContent>
						<ItemRow>
							<Icon name='video' size='x16' />
							<ItemTitle>
								<ItemLink href='#ada-lovelace'>Ada Lovelace</ItemLink>
							</ItemTitle>
							<ItemMeta>Ringing…</ItemMeta>
						</ItemRow>
						<ItemRow>
							<ItemDescription>1 person joined</ItemDescription>
							<ItemActions>
								<IconButton size='mini' variant='secondary' icon='bell-off' aria-label='Silence call from Ada Lovelace' />
								<IconButton size='mini' variant='secondary' icon='cross' aria-label='Decline call from Ada Lovelace' />
							</ItemActions>
						</ItemRow>
					</ItemContent>
				</Item>
			</ItemGroup>
			<Caption>reveal=&quot;hover&quot;, shown on hover and focus</Caption>
			<SidebarSurface>
				<ItemGroup is='ul' aria-label='Actions revealed on hover'>
					<RoomRow room={rooms[0]} />
					<RoomRow room={rooms[2]} />
				</ItemGroup>
			</SidebarSurface>
		</Box>
	),
};

const HiddenActionsMenu = ({ label }: { label: string }) => (
	<ItemActions reveal='hover'>
		<IconButton size='mini' icon='kebab' aria-label={`Options for ${label}`} />
	</ItemActions>
);

export const HiddenActions: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x280'>
			<Caption>Rows: without actions, then with reveal=&quot;hover&quot; actions</Caption>
			<SidebarSurface>
				<ItemGroup is='ul' aria-label='Rows'>
					<Item is='li'>
						<ItemContent>
							<ItemTitle>design-team</ItemTitle>
						</ItemContent>
						<Badge variant='primary'>3</Badge>
					</Item>
					<Item is='li'>
						<ItemContent>
							<ItemTitle>design-team</ItemTitle>
						</ItemContent>
						<Badge variant='primary'>3</Badge>
						<HiddenActionsMenu label='design-team' />
					</Item>
				</ItemGroup>
			</SidebarSurface>
			<Caption>Extended rows: without actions, then with reveal=&quot;hover&quot; actions</Caption>
			<SidebarSurface>
				<ItemGroup is='ul' aria-label='Extended rows'>
					<Item is='li'>
						<ItemContent>
							<ItemRow>
								<ItemTitle>design-team</ItemTitle>
								<ItemMeta>12:45</ItemMeta>
							</ItemRow>
							<ItemRow>
								<ItemDescription>Mockups are ready</ItemDescription>
								<Badge variant='primary'>3</Badge>
							</ItemRow>
						</ItemContent>
					</Item>
					<Item is='li'>
						<ItemContent>
							<ItemRow>
								<ItemTitle>design-team</ItemTitle>
								<ItemMeta>12:45</ItemMeta>
							</ItemRow>
							<ItemRow>
								<ItemDescription>Mockups are ready</ItemDescription>
								<Badge variant='primary'>3</Badge>
								<HiddenActionsMenu label='design-team' />
							</ItemRow>
						</ItemContent>
					</Item>
				</ItemGroup>
			</SidebarSurface>
			<Caption>Group headers: without actions, then with reveal=&quot;hover&quot; actions</Caption>
			<SidebarSurface>
				<ItemGroupHeader>
					<ItemGroupTitle>Favorites</ItemGroupTitle>
					<Badge variant='primary'>3</Badge>
				</ItemGroupHeader>
				<ItemGroupHeader>
					<ItemGroupTitle>Favorites</ItemGroupTitle>
					<Badge variant='primary'>3</Badge>
					<HiddenActionsMenu label='Favorites' />
				</ItemGroupHeader>
			</SidebarSurface>
		</Box>
	),
};

export const Icons: Story = {
	render: () => (
		<SidebarSurface>
			<ItemGroup is='ul' aria-label='Rooms and direct messages'>
				{rooms.map((room) => (
					<RoomRow key={room.id} room={room} />
				))}
			</ItemGroup>
		</SidebarSurface>
	),
};

export const GroupHeaders: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x280'>
			<Caption>Plain</Caption>
			<ItemGroup is='ul'>
				<ItemGroupHeader is='li' aria-hidden>
					<ItemGroupTitle>Recent</ItemGroupTitle>
				</ItemGroupHeader>
				<RoomRow room={rooms[0]} />
			</ItemGroup>
			<Caption>With a count and an inset</Caption>
			<ItemGroup is='ul'>
				<ItemGroupHeader is='li' aria-hidden inset='lg'>
					<ItemGroupTitle>Moderators</ItemGroupTitle>
					<ItemMeta>2</ItemMeta>
				</ItemGroupHeader>
				<RoomRow room={rooms[5]} viewMode='medium' inset='lg' />
			</ItemGroup>
			<Caption>As a heading, with actions</Caption>
			<section aria-labelledby='favorites-title'>
				<ItemGroupHeader>
					<ItemGroupTitle is='h3' id='favorites-title'>
						Favorites
					</ItemGroupTitle>
					<ItemActions reveal='hover'>
						<IconButton size='mini' icon='kebab' aria-label='Options for Favorites' />
					</ItemActions>
				</ItemGroupHeader>
				<ItemGroup is='ul' aria-labelledby='favorites-title'>
					<RoomRow room={rooms[1]} />
				</ItemGroup>
			</section>
		</Box>
	),
};

const CollapsibleGroup = ({
	title,
	defaultExpanded = true,
	children,
	unread,
}: {
	title: string;
	defaultExpanded?: boolean;
	children: ReactNode;
	unread?: number;
}) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const id = title.toLowerCase().replace(/\s+/g, '-');

	return (
		<section aria-labelledby={`${id}-title`}>
			<ItemGroupHeader>
				<ItemGroupTitle
					is='button'
					id={`${id}-title`}
					aria-expanded={expanded}
					aria-controls={`${id}-list`}
					onClick={() => setExpanded((value) => !value)}
				>
					<Chevron size='x16' right={!expanded} />
					{title}
				</ItemGroupTitle>
				{!expanded && !!unread && (
					<Badge variant='primary' title={`${unread} unread messages`}>
						{unread}
					</Badge>
				)}
				<ItemActions reveal='hover'>
					<IconButton size='mini' icon='kebab' aria-label={`Options for ${title}`} />
				</ItemActions>
			</ItemGroupHeader>
			<ItemGroup is='ul' id={`${id}-list`} aria-labelledby={`${id}-title`} hidden={!expanded}>
				{children}
			</ItemGroup>
		</section>
	);
};

export const CollapsibleGroupHeaders: Story = {
	render: () => (
		<SidebarSurface>
			<CollapsibleGroup title='Favorites'>
				<RoomRow room={rooms[1]} />
				<RoomRow room={rooms[2]} />
			</CollapsibleGroup>
			<CollapsibleGroup title='Discussions' defaultExpanded={false} unread={4}>
				<RoomRow room={rooms[7]} />
			</CollapsibleGroup>
		</SidebarSurface>
	),
};

export const Dividers: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x280'>
			<Caption>Full width, under a header</Caption>
			<ItemGroup is='ul'>
				<ItemGroupHeader is='li' aria-hidden inset='lg'>
					<ItemGroupTitle>Owners</ItemGroupTitle>
				</ItemGroupHeader>
				<ItemDivider is='li' aria-hidden />
				<RoomRow room={rooms[4]} viewMode='medium' inset='lg' />
			</ItemGroup>
			<Caption>Inset to the rows</Caption>
			<ItemGroup is='ul' aria-label='Inset divider'>
				<RoomRow room={rooms[0]} inset='md' />
				<ItemDivider is='li' aria-hidden inset='md' />
				<RoomRow room={rooms[3]} inset='md' />
			</ItemGroup>
		</Box>
	),
};

export const Skeletons: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' width='x280'>
			{(['condensed', 'medium', 'extended'] as const).map((viewMode) => (
				<div key={viewMode}>
					<Caption>{viewMode}</Caption>
					<SidebarSurface>
						<ItemGroup is='ul' aria-label={`Loading ${viewMode} rooms`} aria-busy>
							<ItemSkeleton is='li' mediaSize={viewModeAvatarSize[viewMode]} description={viewMode === 'extended'} />
							<ItemSkeleton is='li' mediaSize={viewModeAvatarSize[viewMode]} description={viewMode === 'extended'} />
						</ItemGroup>
					</SidebarSurface>
				</div>
			))}
		</Box>
	),
};

const members: {
	name: string;
	username: string;
	avatar: number;
	status: StatusBulletProps['status'];
}[] = [
	{ name: 'Kenji Takahashi', username: 'kenji', avatar: 0, status: 'away' },
	{
		name: 'Gabriel Henriques',
		username: 'gabriel.henriques',
		avatar: 1,
		status: 'offline',
	},
	{ name: 'Ana Ribeiro', username: 'ana.ribeiro', avatar: 2, status: 'online' },
	{ name: 'Sam Bello', username: 'sbello', avatar: 3, status: 'busy' },
];

const MemberRow = ({ member }: { member: (typeof members)[number] }) => (
	<Item is='li' inset='lg'>
		<ItemMedia>
			<Avatar size='x28' url={leterAvatarUrls[member.avatar]} alt='' />
		</ItemMedia>
		<ItemIcon label={statusLabels[member.status ?? 'offline']}>
			<StatusBullet status={member.status} />
		</ItemIcon>
		<ItemContent>
			<ItemTitle>
				<ItemLink is='button'>
					{member.name} <ItemDescription inline>@{member.username}</ItemDescription>
				</ItemLink>
			</ItemTitle>
		</ItemContent>
		<ItemActions reveal='hover'>
			<IconButton size='small' icon='kebab' aria-label={`Actions for ${member.name}`} />
		</ItemActions>
	</Item>
);

const MembersGroup = ({ title, list }: { title: string; list: typeof members }) => (
	<ItemGroup is='ul'>
		<ItemGroupHeader is='li' aria-hidden inset='lg' sticky>
			<ItemGroupTitle>{title}</ItemGroupTitle>
			<ItemMeta>{list.length}</ItemMeta>
		</ItemGroupHeader>
		<ItemDivider is='li' aria-hidden />
		{list.map((member) => (
			<MemberRow key={member.username} member={member} />
		))}
	</ItemGroup>
);

export const NarrowList: Story = {
	render: () => (
		<Box width='x280' borderWidth='default' borderColor='extra-light'>
			<MembersGroup title='Members' list={members} />
		</Box>
	),
};

const SidebarRoomListDemo = ({ viewMode }: { viewMode: ViewMode }) => (
	<SidebarSurface>
		<CollapsibleGroup title='Favorites'>
			{rooms.slice(0, 3).map((room, index) => (
				<RoomRow key={room.id} room={room} viewMode={viewMode} selected={index === 1} />
			))}
		</CollapsibleGroup>
		<CollapsibleGroup title='Direct messages'>
			{rooms.slice(4, 7).map((room) => (
				<RoomRow key={room.id} room={room} viewMode={viewMode} />
			))}
		</CollapsibleGroup>
		<CollapsibleGroup title='Discussions' defaultExpanded={false} unread={4}>
			<RoomRow room={rooms[7]} viewMode={viewMode} />
		</CollapsibleGroup>
	</SidebarSurface>
);

export const SidebarRoomList: StoryObj<typeof SidebarRoomListDemo> = {
	args: { viewMode: 'extended' },
	argTypes: {
		viewMode: {
			control: 'inline-radio',
			options: ['condensed', 'medium', 'extended'],
		},
	},
	render: (args) => <SidebarRoomListDemo {...args} />,
};

export const SearchResults: Story = {
	render: () => (
		<Box width='x280' backgroundColor='light' paddingBlock={4} elevation='2'>
			<div role='listbox' id='search-results' aria-label='Search results'>
				<ItemGroup is='ul' role='group'>
					<ItemGroupHeader is='li' aria-hidden inset='sm'>
						<ItemGroupTitle>Recent</ItemGroupTitle>
					</ItemGroupHeader>
					{rooms.slice(0, 3).map((room, index) => (
						<Item
							key={room.id}
							is='li'
							role='option'
							id={`search-results-${index}`}
							aria-selected={index === 0}
							focused={index === 0}
							inset='sm'
						>
							<ItemMedia>
								<Avatar size='x20' url={leterAvatarUrls[room.avatar]} alt='' />
							</ItemMedia>
							<RoomIcon room={room} />
							<ItemContent>
								<ItemTitle>{room.name}</ItemTitle>
							</ItemContent>
						</Item>
					))}
				</ItemGroup>
			</div>
		</Box>
	),
};

export const RoomMembers: Story = {
	render: () => (
		<Box width='x400' borderWidth='default' borderColor='extra-light'>
			<MembersGroup title='Owners' list={members.slice(0, 1)} />
			<MembersGroup title='Moderators' list={members.slice(1, 2)} />
			<MembersGroup title='Members' list={members.slice(2)} />
		</Box>
	),
};

const files: {
	name: string;
	icon: IconProps['name'];
	author: string;
	size: string;
	date: string;
}[] = [
	{
		name: 'Q3-roadmap-review.pdf',
		icon: 'file-pdf',
		author: 'kenji',
		size: '2.4 MB',
		date: 'Sep 24',
	},
	{
		name: 'sidebar-item-spec@2x.png',
		icon: 'image',
		author: 'ana.ribeiro',
		size: '812 KB',
		date: 'Sep 22',
	},
	{
		name: 'e2e-traces-42425.zip',
		icon: 'zip',
		author: 'sbello',
		size: '18.1 MB',
		date: 'Sep 19',
	},
];

export const RoomFiles: Story = {
	render: () => (
		<Box width='x400' borderWidth='default' borderColor='extra-light'>
			<ItemGroup is='ul' aria-label='Files'>
				{files.map((file) => (
					<Item key={file.name} is='li' inset='lg'>
						<ItemMedia>
							<Icon name={file.icon} size='x36' />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<ItemLink href={`#${file.name}`}>{file.name}</ItemLink>
							</ItemTitle>
							<ItemRow>
								<ItemDescription>
									@{file.author} · {file.size}
								</ItemDescription>
								<ItemMeta>{file.date}</ItemMeta>
							</ItemRow>
						</ItemContent>
						<ItemActions reveal='hover'>
							<IconButton size='small' icon='download' aria-label={`Download ${file.name}`} />
							<IconButton size='small' icon='kebab' aria-label={`More options for ${file.name}`} />
						</ItemActions>
					</Item>
				))}
			</ItemGroup>
		</Box>
	),
};

const MenuRow = ({
	icon,
	children,
	focused,
	variant,
	shortcut,
	checked,
}: {
	icon?: IconProps['name'];
	children: ReactNode;
	focused?: boolean;
	variant?: 'danger';
	shortcut?: string;
	checked?: boolean;
}) => (
	<Item
		role={checked === undefined ? 'menuitem' : 'menuitemradio'}
		aria-checked={checked}
		tabIndex={-1}
		inset='md'
		focused={focused}
		variant={variant}
	>
		{icon && (
			<ItemMedia variant='icon'>
				<Icon name={icon} size='x20' />
			</ItemMedia>
		)}
		<ItemContent>
			<ItemTitle>{children}</ItemTitle>
		</ItemContent>
		{shortcut && <ItemMeta>{shortcut}</ItemMeta>}
		{checked && <Icon name='check' size='x16' color='info' />}
	</Item>
);

export const MenuSections: Story = {
	render: () => (
		<Box width='x240' backgroundColor='light' paddingBlock={8} elevation='2'>
			<div role='menu' aria-label='Room options'>
				<ItemGroup role='group'>
					<ItemGroupHeader role='presentation' inset='md'>
						<ItemGroupTitle>Room</ItemGroupTitle>
					</ItemGroupHeader>
					<MenuRow icon='star' focused>
						Favorite
					</MenuRow>
					<MenuRow icon='check' shortcut='⇧ Esc'>
						Mark as read
					</MenuRow>
					<MenuRow icon='bell-off'>Mute notifications</MenuRow>
				</ItemGroup>
				<ItemDivider role='separator' />
				<ItemGroup role='group'>
					<ItemGroupHeader role='presentation' inset='md'>
						<ItemGroupTitle>Status</ItemGroupTitle>
					</ItemGroupHeader>
					<MenuRow checked>Online</MenuRow>
					<MenuRow checked={false}>Busy</MenuRow>
				</ItemGroup>
				<ItemDivider role='separator' />
				<MenuRow icon='trash' variant='danger'>
					Leave room
				</MenuRow>
			</div>
		</Box>
	),
};

export const SelectOptions: Story = {
	render: () => (
		<Box width='x280' backgroundColor='light' paddingBlock={8} elevation='2'>
			<ItemGroup is='ul' role='listbox' aria-label='Users' aria-multiselectable>
				{members.map((member, index) => (
					<Item
						key={member.username}
						is='li'
						role='option'
						aria-selected={index === 2}
						selected={index === 2}
						focused={index === 0}
						inset='md'
					>
						<ItemMedia>
							<Avatar size='x20' url={leterAvatarUrls[member.avatar]} alt='' />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								{member.name} <ItemDescription inline>@{member.username}</ItemDescription>
							</ItemTitle>
						</ItemContent>
						{index === 2 && <Icon name='check' size='x16' color='info' />}
					</Item>
				))}
			</ItemGroup>
		</Box>
	),
};

const commands = [
	{
		command: '/invite',
		params: '@username',
		description: 'Invite one user to join this channel',
	},
	{ command: '/leave', description: 'Leave the current channel' },
	{
		command: '/invite-all-from',
		params: '#room',
		description: 'Invite all users from another room to join this channel',
	},
];

export const CommandSuggestions: Story = {
	render: () => (
		<Box width='x320' backgroundColor='light' paddingBlock={8} elevation='2'>
			<ItemGroup is='ul' role='listbox' aria-label='Commands'>
				{commands.map(({ command, params, description }, index) => (
					<Item key={command} is='li' role='option' aria-selected={index === 0} focused={index === 0} inset='md'>
						<ItemContent>
							<ItemTitle>
								{command}
								{params && <ItemDescription inline>{params}</ItemDescription>}
							</ItemTitle>
						</ItemContent>
						<ItemMeta truncate title={description}>
							{description}
						</ItemMeta>
					</Item>
				))}
			</ItemGroup>
		</Box>
	),
};
