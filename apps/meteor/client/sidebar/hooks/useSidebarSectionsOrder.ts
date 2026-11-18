import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';

export const useSidebarSectionsOrder = (): readonly string[] =>
	useUserPreference<string[]>('sidebarSectionsOrder') ?? SIDEBAR_SYSTEM_GROUP_KEYS;
