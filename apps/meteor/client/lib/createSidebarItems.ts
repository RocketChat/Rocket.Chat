import type { Subscription } from 'use-subscription';

type SidebarItem = {
	i18nLabel: string;
	href?: string;
	icon?: string;
	tag?: 'Alpha';
	permissionGranted?: boolean | (() => boolean);
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
