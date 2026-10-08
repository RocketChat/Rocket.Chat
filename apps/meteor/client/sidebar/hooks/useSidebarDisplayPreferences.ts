import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export type SidebarViewMode = 'extended' | 'condensed';

export type SidebarAvatarSize = 'small' | 'medium' | 'large';

export type SidebarDisplayPreferences = {
	/** How much breathing room each row has. It no longer decides what a row shows. */
	viewMode: SidebarViewMode;
	displayAvatar: boolean;
	avatarSize: SidebarAvatarSize;
	/** Whether rows show the room's last message. Off whenever the workspace does not store last messages. */
	displayPreview: boolean;
	/** Whether the workspace stores the last message of each room, which the preview needs. */
	isPreviewAvailable: boolean;
};

const AVATAR_SIZES: SidebarAvatarSize[] = ['small', 'medium', 'large'];

/** Reads a stored `sidebarViewMode`. `medium`, a view mode before the avatar got its own size, reads as Condensed. */
export const toSidebarViewMode = (value: unknown): SidebarViewMode => (value === 'extended' ? 'extended' : 'condensed');

const toAvatarSize = (value: unknown): SidebarAvatarSize =>
	AVATAR_SIZES.includes(value as SidebarAvatarSize) ? (value as SidebarAvatarSize) : 'medium';

// Fallbacks match the shipped admin defaults (Accounts_Default_User_Preferences_*).
export const useSidebarDisplayPreferences = (): SidebarDisplayPreferences => {
	const viewMode = toSidebarViewMode(useUserPreference<string>('sidebarViewMode'));
	const displayAvatar = useUserPreference<boolean>('sidebarDisplayAvatar', true) ?? true;
	const avatarSize = toAvatarSize(useUserPreference<string>('sidebarAvatarSize'));
	const displayPreviewPreference = useUserPreference<boolean>('sidebarDisplayPreview', false) ?? false;
	const isPreviewAvailable = useSetting('Store_Last_Message', true) ?? true;

	const displayPreview = isPreviewAvailable && displayPreviewPreference;

	return useMemo(
		() => ({ viewMode, displayAvatar, avatarSize, displayPreview, isPreviewAvailable }),
		[viewMode, displayAvatar, avatarSize, displayPreview, isPreviewAvailable],
	);
};
