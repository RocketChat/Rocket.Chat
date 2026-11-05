import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
	SidebarItem,
	SidebarItemActions,
	SidebarItemAvatarWrapper,
	SidebarItemBadge,
	SidebarItemCol,
	SidebarItemContent,
	SidebarItemIcon,
	SidebarItemLink,
	SidebarItemMenu,
	SidebarItemRow,
	SidebarItemTimestamp,
	SidebarItemTitle,
	SidebarListItem,
} from '.';
import { Avatar } from '../../Avatar';
import { IconButton } from '../../Button';
import { GenericCondensedItem, GenericExtendedItem, GenericMediumItem, MenuTemplate, decorators, leterAvatarUrls } from '../helpers';

export default {
	title: 'Navigation/Sidebar/Item',
	component: SidebarListItem,
	decorators,
	parameters: {
		docs: {
			description: {
				component:
					'A single room row within the chat sidebar.\n\n' +
					'**Rules**\n' +
					'- Use the unread status to highlight rooms with new activity; use badges for counts.\n' +
					'- Shows the room name, an optional avatar/icon, and a trailing timestamp/status.',
			},
		},
	},
	argTypes: {
		selected: {
			control: 'boolean',
			description: 'Marks the list item as the currently selected entry.',
		},
		children: {
			control: false,
			description: 'Content of the list item.',
		},
	},
} satisfies Meta<typeof SidebarListItem>;

type Story = StoryObj<typeof SidebarListItem>;

export const CondensedItems = () => (
	<>
		{Array.from({ length: 8 }).map((_, i) => (
			<GenericCondensedItem key={i} i={i} />
		))}
	</>
);

export const Condensed: Story = {
	render: CondensedItems,
};

export const Medium: Story = {
	render: () => (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<GenericMediumItem key={i} i={i} />
			))}
		</>
	),
};

export const Extended: Story = {
	render: () => (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<GenericExtendedItem key={i} i={i} />
			))}
		</>
	),
};

type RoomRowProps = {
	name: string;
	avatar: string;
	viewMode: 'condensed' | 'medium' | 'extended';
	selected?: boolean;
	unread?: number;
	ringing?: boolean;
};

const avatarSizes = {
	condensed: 'x20',
	medium: 'x28',
	extended: 'x36',
} as const;

const RoomRow = ({ name, avatar, viewMode, selected, unread, ringing }: RoomRowProps) => {
	const icon = <SidebarItemIcon icon='hashtag-lock' label='Private channel' />;
	const title = (
		<SidebarItemTitle unread={!!unread}>
			<SidebarItemLink href={`#${name}`} aria-current={selected ? 'page' : undefined}>
				{name}
			</SidebarItemLink>
		</SidebarItemTitle>
	);
	const badge = !!unread && <SidebarItemBadge title={`${unread} unread messages`}>{unread}</SidebarItemBadge>;
	const menu = (
		<SidebarItemMenu>
			<MenuTemplate />
		</SidebarItemMenu>
	);
	const callActions = (
		<SidebarItemActions>
			<IconButton size='mini' variant='secondary-success' icon='phone' aria-label={`Accept call from ${name}`} />
			<IconButton size='mini' variant='secondary-danger' icon='phone-off' aria-label={`Reject call from ${name}`} />
		</SidebarItemActions>
	);

	return (
		<SidebarListItem>
			<SidebarItem is='div' selected={selected} highlighted={!!unread}>
				<SidebarItemAvatarWrapper>
					<Avatar size={avatarSizes[viewMode]} url={avatar} alt='' />
				</SidebarItemAvatarWrapper>
				{viewMode === 'extended' ? (
					<SidebarItemCol>
						<SidebarItemRow>
							{icon}
							{title}
							<SidebarItemTimestamp unread={!!unread}>12:45</SidebarItemTimestamp>
						</SidebarItemRow>
						<SidebarItemRow>
							<SidebarItemContent unread={!!unread}>{ringing ? 'Calling…' : 'Mockups are ready for review'}</SidebarItemContent>
							{badge}
							{ringing && callActions}
							{menu}
						</SidebarItemRow>
					</SidebarItemCol>
				) : (
					<>
						{icon}
						{title}
						{badge}
						{ringing && callActions}
						{menu}
					</>
				)}
			</SidebarItem>
		</SidebarListItem>
	);
};

const RoomRows = ({ viewMode }: Pick<RoomRowProps, 'viewMode'>) => (
	<>
		<RoomRow name='design-team' avatar={leterAvatarUrls[0]} viewMode={viewMode} />
		<RoomRow name='product' avatar={leterAvatarUrls[1]} viewMode={viewMode} unread={3} />
		<RoomRow name='marketing' avatar={leterAvatarUrls[2]} viewMode={viewMode} selected />
		<RoomRow name='support' avatar={leterAvatarUrls[3]} viewMode={viewMode} ringing />
	</>
);

export const RoomRowCondensed: Story = {
	name: 'Room row: condensed',
	render: () => <RoomRows viewMode='condensed' />,
};

export const RoomRowMedium: Story = {
	name: 'Room row: medium',
	render: () => <RoomRows viewMode='medium' />,
};

export const RoomRowExtended: Story = {
	name: 'Room row: extended',
	render: () => <RoomRows viewMode='extended' />,
};
