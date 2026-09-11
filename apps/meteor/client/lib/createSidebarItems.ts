import type { Keys as IconName } from '@rocket.chat/icons';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { GO_ROCKET_CHAT_PREFIX } from './links';

export type Item = {
	i18nLabel: string;
	href?: LocationPathname | `${typeof GO_ROCKET_CHAT_PREFIX}${string}`;
	icon?: IconName;
	tag?: 'Alpha' | 'Beta';
	permissionGranted?: () => boolean;
	pathSection?: string;
	name?: string;
	externalUrl?: boolean;
	badge?: () => ReactNode;
};
export type SidebarDivider = { divider: boolean; i18nLabel: string };
export type SidebarItem = Item | SidebarDivider;
export const isSidebarItem = (item: SidebarItem): item is Item => !('divider' in item);

export const isGoRocketChatLink = (link: string): link is `${typeof GO_ROCKET_CHAT_PREFIX}${string}` =>
	link.startsWith(GO_ROCKET_CHAT_PREFIX);

export const createSidebarItems = (
	initialItems: SidebarItem[] = [],
): {
	registerSidebarItem: (item: SidebarItem) => void;
	unregisterSidebarItem: (i18nLabel: SidebarItem['i18nLabel']) => void;
	getSidebarItems: () => SidebarItem[];
	subscribeToSidebarItems: (callback: () => void) => () => void;
} => {
	let items = initialItems;
	let updateCb: () => void = () => undefined;

	const getSidebarItems = (): SidebarItem[] => items;

	const subscribeToSidebarItems = (cb: () => void): (() => void) => {
		updateCb = cb;
		return (): void => {
			updateCb = (): void => undefined;
		};
	};

	// Snapshots feed useSyncExternalStore, which bails out when the reference is
	// unchanged, so every mutation has to produce a new array.
	const registerSidebarItem = (item: SidebarItem): void => {
		items = [...items, item];
		updateCb();
	};

	const unregisterSidebarItem = (i18nLabel: SidebarItem['i18nLabel']): void => {
		items = items.filter((item) => item.i18nLabel !== i18nLabel);
		updateCb();
	};

	return {
		registerSidebarItem,
		unregisterSidebarItem,
		getSidebarItems,
		subscribeToSidebarItems,
	};
};
