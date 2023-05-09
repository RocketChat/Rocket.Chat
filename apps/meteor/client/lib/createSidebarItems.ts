import type { IconProps } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type Item = {
	i18nLabel: string;
	href?: string;
	icon?: IconProps['name'];
	tag?: 'Alpha' | 'Beta';
	permissionGranted?: boolean | (() => boolean);
	pathSection?: string;
	pathGroup?: string;
	name?: string;
	externalUrl?: boolean;
	badge?: () => ReactElement;
};
export type SidebarItem = Item | { divider: boolean; i18nLabel: string }; // TODO: Remove this when we have a better way to handle dividers
export const isSidebarItem = (item: SidebarItem): item is Item => !('divider' in item);

export const createSidebarItems = (
	initialItems: SidebarItem[] = [],
): {
	registerSidebarItem: (item: SidebarItem) => void;
	unregisterSidebarItem: (i18nLabel: SidebarItem['i18nLabel']) => void;
	getSidebarItems: () => SidebarItem[];
	subscribeToSidebarItems: (callback: () => void) => () => void;
} => {
	const items = initialItems;
	let updateCb: () => void = () => undefined;

	const getSidebarItems = (): SidebarItem[] => items;

	const subscribeToSidebarItems = (cb: () => void): (() => void) => {
		updateCb = cb;
		return (): void => {
			updateCb = (): void => undefined;
		};
	};

	const registerSidebarItem = (item: SidebarItem): void => {
		items.push(item);
		updateCb();
	};

	const unregisterSidebarItem = (i18nLabel: SidebarItem['i18nLabel']): void => {
		const index = items.findIndex((item) => item.i18nLabel === i18nLabel);
		delete items[index];
		updateCb();
	};

	return {
		registerSidebarItem,
		unregisterSidebarItem,
		getSidebarItems,
		subscribeToSidebarItems,
	};
};
