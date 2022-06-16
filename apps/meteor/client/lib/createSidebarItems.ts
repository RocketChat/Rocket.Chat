import { IconProps } from '@rocket.chat/fuselage';
import type { Subscription } from 'use-subscription';

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
	itemsSubscription: Subscription<SidebarItem[]>;
} => {
	const items = initialItems;
	let updateCb: () => void = () => undefined;

	const itemsSubscription: Subscription<SidebarItem[]> = {
		subscribe: (cb) => {
			updateCb = cb;
			return (): void => {
				updateCb = (): void => undefined;
			};
		},
		getCurrentValue: () => items,
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
		itemsSubscription,
	};
};
