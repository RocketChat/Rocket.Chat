import type { IconProps } from '@rocket.chat/fuselage';

export type SidebarItem = {
	i18nLabel: string;
	href?: string;
	icon?: IconProps['name'];
	tag?: 'Alpha';
	permissionGranted?: boolean | (() => boolean);
	pathSection?: string;
	pathGroup?: string;
	name?: string;
};

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
