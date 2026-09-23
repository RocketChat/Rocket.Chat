import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ComponentType } from 'react';
import { createElement } from 'react';

import Condensed from './Condensed';
import Extended from './Extended';
import Medium from './Medium';
import type { SidebarViewMode } from '../lib/sidebarPresentation';

export type SidebarRoomAvatar = ComponentType<SubscriptionWithRoom & { rid: string }>;

export type SidebarItemTemplate = typeof Condensed | typeof Medium | typeof Extended;

/** The rows this sidebar draws with. A different sidebar brings its own and ignores these. */
export const itemTemplateByViewMode: Record<SidebarViewMode, SidebarItemTemplate> = {
	condensed: Condensed,
	medium: Medium,
	extended: Extended,
};

const avatarSizeByViewMode = { condensed: 'x20', medium: 'x28', extended: 'x36' } as const;

export const roomAvatarForViewMode =
	(viewMode: SidebarViewMode): SidebarRoomAvatar =>
	(room) =>
		createElement(RoomAvatar, { size: avatarSizeByViewMode[viewMode], room: { ...room, _id: room.rid || room._id, type: room.t } });
