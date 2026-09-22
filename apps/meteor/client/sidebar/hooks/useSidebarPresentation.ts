import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { createElement, useMemo } from 'react';

import Condensed from '../Item/Condensed';
import Extended from '../Item/Extended';

export type SidebarViewMode = 'extended' | 'condensed';

export type SidebarRoomAvatar = ComponentType<SubscriptionWithRoom & { rid: string }>;

export type SidebarItemTemplate = typeof Condensed | typeof Extended;

export type SidebarPresentation = {
	viewMode: SidebarViewMode;
	extended: boolean;
	showAvatar: boolean;
	/** What one row occupies, which the virtual list needs before it has drawn any. */
	rowHeight: number;
	ItemTemplate: SidebarItemTemplate;
	/** Null when this reader turned avatars off, so a row has nothing to draw rather than a hidden one. */
	AvatarTemplate: SidebarRoomAvatar | null;
};

const rowHeightByViewMode: Record<SidebarViewMode, number> = {
	condensed: 28,
	extended: 48,
};

const renderRoomAvatar: SidebarRoomAvatar = (room) =>
	createElement(RoomAvatar, { size: 'x20', room: { ...room, _id: room.rid || room._id, type: room.t } });

/** How this reader wants the room list drawn — asked once, for the whole sidebar. */
export const useSidebarPresentation = (): SidebarPresentation => {
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarDisplayAvatar = useUserPreference('sidebarDisplayAvatar');

	return useMemo(() => {
		const viewMode: SidebarViewMode = sidebarViewMode === 'extended' ? 'extended' : 'condensed';
		const showAvatar = Boolean(sidebarDisplayAvatar);

		return {
			viewMode,
			extended: viewMode === 'extended',
			showAvatar,
			rowHeight: rowHeightByViewMode[viewMode],
			ItemTemplate: viewMode === 'extended' ? Extended : Condensed,
			AvatarTemplate: showAvatar ? renderRoomAvatar : null,
		};
	}, [sidebarViewMode, sidebarDisplayAvatar]);
};
