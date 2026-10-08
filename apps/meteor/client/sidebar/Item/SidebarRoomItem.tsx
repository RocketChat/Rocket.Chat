import {
	IconButton,
	SidebarItem,
	SidebarItemAvatarWrapper,
	SidebarItemCol,
	SidebarItemContent,
	SidebarItemMenu,
	SidebarItemRow,
	SidebarItemTimestamp,
	SidebarItemTitle,
} from '@rocket.chat/fuselage';
import { useShortTimeAgo } from '@rocket.chat/ui-client';
import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

import { getSidebarItemLayout, getSidebarPreviewGap } from './sidebarItemLayout';
import { useDeferredMenuMount } from './useDeferredMenuMount';
import type { SidebarAvatarSize, SidebarViewMode } from '../hooks/useSidebarDisplayPreferences';

export type SidebarRoomItemProps = {
	/** Breathing room around the row's content. */
	viewMode: SidebarViewMode;
	/** Size `avatar` is rendered at, so the row can make room for it. Leave out when there is no avatar. */
	avatarSize?: SidebarAvatarSize;
	/** Shows `subtitle` (the last message) and `time` on the row. */
	displayPreview: boolean;
	title: ReactNode;
	titleIcon?: ReactNode;
	avatar?: ReactNode;
	icon?: ReactNode;
	actions?: ReactNode;
	href?: string;
	time?: Date | string;
	subtitle?: ReactNode;
	unread?: boolean;
	menu?: () => ReactNode;
	menuOptions?: unknown;
	threadUnread?: boolean;
	selected?: boolean;
	badges?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

// The preview line is as tall as its text. In Extended it also holds the badges and the menu, which are taller
// (20px): they stay centred on the text instead of stretching the line, so the title and the preview sit centred in
// the row. The column lets them overflow by those 2px rather than clipping them.
// The preview keeps the same colour whether the room is unread or not; only the title is highlighted.
const previewLineStyle = { blockSize: 16 };
const previewLineWithGapStyle = { ...previewLineStyle, marginBlockStart: '0.25rem' };
const previewColumnStyle = { overflow: 'visible', minInlineSize: 0 } as const;

const SidebarRoomItem = ({
	viewMode,
	avatarSize,
	displayPreview,
	icon,
	title,
	titleIcon,
	avatar,
	actions,
	time,
	subtitle,
	badges,
	unread,
	menu,
	menuOptions: _menuOptions,
	threadUnread: _threadUnread,
	style,
	...props
}: SidebarRoomItemProps) => {
	const formatDate = useShortTimeAgo();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	const renderedAvatarSize = avatar ? avatarSize : undefined;
	const { height, paddingBlock } = getSidebarItemLayout(viewMode, displayPreview, renderedAvatarSize);
	const previewStyle = getSidebarPreviewGap(viewMode, renderedAvatarSize) ? previewLineWithGapStyle : previewLineStyle;
	const rowStyle = { ...style, boxSizing: 'border-box' as const, blockSize: height, paddingBlock };
	const avatarElement = avatar && <SidebarItemAvatarWrapper>{avatar}</SidebarItemAvatarWrapper>;
	const titleElement = <SidebarItemTitle unread={unread}>{title}</SidebarItemTitle>;
	const timestamp = time && <SidebarItemTimestamp>{formatDate(time)}</SidebarItemTimestamp>;
	const menuElement = menu && (
		<SidebarItemMenu>
			{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' onPointerDown={mountNow} />}
		</SidebarItemMenu>
	);

	if (!displayPreview) {
		return (
			<SidebarItem {...props} style={rowStyle} onFocus={mountNow} onPointerEnter={requestMount}>
				{avatarElement}
				{icon}
				{titleElement}
				{titleIcon}
				{badges}
				{actions}
				{menuElement}
			</SidebarItem>
		);
	}

	// With the preview, a small avatar fits the title line, so it stays inline before the title in every view mode;
	// a larger one gets its own column.
	const isAvatarInline = avatarSize === 'small';

	// Extended keeps the layout it always had: time next to the title, and the last message sharing the second line
	// with badges and menu.
	if (viewMode === 'extended') {
		return (
			<SidebarItem {...props} style={rowStyle} onFocus={mountNow} onPointerEnter={requestMount}>
				{!isAvatarInline && avatarElement}
				<SidebarItemCol style={previewColumnStyle}>
					<SidebarItemRow>
						{isAvatarInline && avatarElement}
						{icon}
						{titleElement}
						{timestamp}
					</SidebarItemRow>
					<SidebarItemRow style={previewStyle}>
						<SidebarItemContent>{subtitle}</SidebarItemContent>
						{titleIcon}
						{badges}
						{actions}
						{menuElement}
					</SidebarItemRow>
				</SidebarItemCol>
			</SidebarItem>
		);
	}

	return (
		<SidebarItem {...props} style={rowStyle} onFocus={mountNow} onPointerEnter={requestMount}>
			{!isAvatarInline && avatarElement}
			<SidebarItemCol>
				<SidebarItemRow>
					{isAvatarInline && avatarElement}
					{icon}
					{titleElement}
					{titleIcon}
					{badges}
					{actions}
					{menuElement}
				</SidebarItemRow>
				<SidebarItemRow style={previewStyle}>
					<SidebarItemContent>{subtitle}</SidebarItemContent>
					{timestamp}
				</SidebarItemRow>
			</SidebarItemCol>
		</SidebarItem>
	);
};

export default memo(SidebarRoomItem);
