
export const createSidebarItems = (initialItems = []) => {
	const items = initialItems;
	let updateCb = () => {};

	const itemsSubscription = {
		subscribe: (cb) => {
			updateCb = cb;
			return () => {
				updateCb = () => {};
			};
		},
		getCurrentValue: () => items,
	};
	const registerSidebarItem = (item) => {
		items.push(item);
		updateCb();
	};
	const unregisterSidebarItem = (label) => {
		const index = items.findIndex(({ i18nLabel }) => i18nLabel === label);
		delete items[index];
		updateCb();
	};

	return { registerSidebarItem, unregisterSidebarItem, itemsSubscription };
};
