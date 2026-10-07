import { Box, SidebarItemBadge, SidebarItemIcon, Icon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { Meta, StoryFn } from '@storybook/react';

import SidebarRoomItem from './SidebarRoomItem';
import { SIDEBAR_ITEM_AVATAR_SIZE, getSidebarItemGap } from './sidebarItemLayout';
import type { SidebarAvatarSize } from '../hooks/useSidebarDisplayPreferences';

export default {
	component: SidebarRoomItem,
	decorators: [
		(fn) => (
			<Box maxWidth='x300' backgroundColor='light' borderRadius='medium'>
				{fn()}
			</Box>
		),
	],
	args: {
		viewMode: 'condensed',
		avatarSize: 'medium',
		displayPreview: false,
		title: 'John Doe',
		subtitle: 'John Doe: are we still on for later?',
		time: new Date(),
	},
} satisfies Meta<typeof SidebarRoomItem>;

const avatarUrl = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" fill="#1d74f5"/><text x="18" y="24" font-family="sans-serif" font-size="16" fill="#fff" text-anchor="middle">JD</text></svg>',
)}`;

const avatarFor = (avatarSize: SidebarAvatarSize) => (
	<UserAvatar username='john.doe' size={SIDEBAR_ITEM_AVATAR_SIZE[avatarSize]} url={avatarUrl} />
);

const Template: StoryFn<typeof SidebarRoomItem> = (args) => (
	<SidebarRoomItem
		{...args}
		avatar={args.avatarSize && avatarFor(args.avatarSize)}
		icon={<SidebarItemIcon icon={<Icon name='hashtag' size='x20' />} />}
		badges={<SidebarItemBadge variant='primary'>3</SidebarItemBadge>}
		menu={() => null}
	/>
);

export const Default = {
	render: Template,
};

export const WithPreview = {
	render: Template,
	args: {
		displayPreview: true,
	},
};

/** Every combination of view mode, avatar size and preview, to compare row heights. */
export const Matrix: StoryFn<typeof SidebarRoomItem> = (args) => (
	<Box display='flex' flexDirection='column' gap={16}>
		{(['condensed', 'extended'] as const).map((viewMode) =>
			[false, true].map((displayPreview) =>
				([undefined, 'small', 'medium', 'large'] as const).map((avatarSize) => (
					<Box key={`${viewMode}-${displayPreview}-${avatarSize}`}>
						<Box fontScale='micro' color='hint' paddingInline={8}>
							{`${viewMode} · preview ${displayPreview ? 'on' : 'off'} · avatar ${avatarSize ?? 'off'}`}
						</Box>
						<SidebarRoomItem
							{...args}
							viewMode={viewMode}
							displayPreview={displayPreview}
							avatarSize={avatarSize}
							avatar={avatarSize && avatarFor(avatarSize)}
							icon={<SidebarItemIcon icon={<Icon name='hashtag' size='x20' />} />}
							badges={<SidebarItemBadge variant='primary'>3</SidebarItemBadge>}
							menu={() => null}
						/>
					</Box>
				)),
			),
		)}
	</Box>
);

/** A few rows of each view mode side by side, with the space the room list puts between rows. */
export const Lists: StoryFn<typeof SidebarRoomItem> = (args) => (
	<Box display='flex' gap={24}>
		{(['condensed', 'extended'] as const).map((viewMode) => (
			<Box key={viewMode} width='x280'>
				<Box fontScale='micro' color='hint' paddingInline={8} mbe={8}>
					{viewMode}
				</Box>
				{['general', 'design', 'engineering', 'random'].map((name, index) => (
					<Box key={name} paddingBlock={getSidebarItemGap(viewMode) / 2}>
						<SidebarRoomItem
							{...args}
							viewMode={viewMode}
							title={name}
							selected={index === 1}
							avatar={args.avatarSize && avatarFor(args.avatarSize)}
							icon={<SidebarItemIcon icon={<Icon name='hashtag' size='x20' />} />}
							badges={index === 0 ? <SidebarItemBadge variant='primary'>1</SidebarItemBadge> : undefined}
							menu={() => null}
						/>
					</Box>
				))}
			</Box>
		))}
	</Box>
);
Lists.args = {
	displayPreview: true,
	avatarSize: 'large',
};
