import type { ISetting } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

type OldViewMode = 'extended' | 'medium' | 'condensed';

type DisplayPreferences = {
	viewMode: 'extended' | 'condensed';
	avatarSize: 'small' | 'medium' | 'large';
	displayPreview: boolean;
};

const OLD_VIEW_MODES: OldViewMode[] = ['extended', 'medium', 'condensed'];

const isOldViewMode = (value: unknown): value is OldViewMode => OLD_VIEW_MODES.includes(value as OldViewMode);

// The view mode used to decide the row height, the avatar size and whether the last message was shown. Now the view
// mode (Condensed or Extended) only sets the spacing, the avatar has its own size, and the last message is its own
// preference. Every old view mode maps to the combination closest to what it rendered:
// - Condensed rows had a 20px avatar inline with the title;
// - Medium was Condensed with a 28px avatar, which also made the row taller;
// - Extended was the only mode showing the last message, with a 36px avatar.
// Whether the avatar is shown (sidebarDisplayAvatar) does not change.
const mapDisplayPreferences = (viewMode: OldViewMode): DisplayPreferences => {
	switch (viewMode) {
		case 'extended':
			return { viewMode: 'extended', avatarSize: 'large', displayPreview: true };
		case 'medium':
			return { viewMode: 'condensed', avatarSize: 'medium', displayPreview: false };
		case 'condensed':
			return { viewMode: 'condensed', avatarSize: 'small', displayPreview: false };
	}
};

addMigration({
	version: 336,
	name: 'Split the sidebar view mode into spacing, avatar size and message preview',
	async up() {
		const viewModeSetting = await Settings.findOneById<Pick<ISetting, 'value'>>('Accounts_Default_User_Preferences_sidebarViewMode', {
			projection: { value: 1 },
		});

		const oldDefaultViewMode = isOldViewMode(viewModeSetting?.value) ? viewModeSetting.value : 'medium';
		const newDefaults = mapDisplayPreferences(oldDefaultViewMode);

		await Settings.updateValueById('Accounts_Default_User_Preferences_sidebarViewMode', newDefaults.viewMode);
		await Settings.updateValueById('Accounts_Default_User_Preferences_sidebarAvatarSize', newDefaults.avatarSize);
		await Settings.updateValueById('Accounts_Default_User_Preferences_sidebarDisplayPreview', newDefaults.displayPreview);

		// Users who never picked a view mode follow the new defaults, which already render as before. Everyone else
		// gets stored whatever the new defaults would not reproduce.
		for (const storedViewMode of OLD_VIEW_MODES) {
			const effective = mapDisplayPreferences(storedViewMode);

			const $set: Record<string, unknown> = {};
			if (effective.viewMode !== storedViewMode) {
				$set['settings.preferences.sidebarViewMode'] = effective.viewMode;
			}
			if (effective.avatarSize !== newDefaults.avatarSize) {
				$set['settings.preferences.sidebarAvatarSize'] = effective.avatarSize;
			}
			if (effective.displayPreview !== newDefaults.displayPreview) {
				$set['settings.preferences.sidebarDisplayPreview'] = effective.displayPreview;
			}

			if (!Object.keys($set).length) {
				continue;
			}

			await Users.updateMany(
				{
					'settings.preferences.sidebarViewMode': storedViewMode,
					'settings.preferences.sidebarAvatarSize': { $exists: false },
					'settings.preferences.sidebarDisplayPreview': { $exists: false },
				},
				{ $set },
			);
		}
	},
});
