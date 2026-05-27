import type { RoomToolboxLayoutConfig, RoomToolboxBaseAction, RoomToolboxHiddenSection } from './layoutEngine.types';

export const processActions = (actionsBase: RoomToolboxBaseAction[], config: RoomToolboxLayoutConfig | null) => {
	const appActions = actionsBase.filter((a) => a.type === 'apps');
	const nonAppActions = actionsBase.filter((a) => a.type !== 'apps');

	if (!config || !config.items || config.items.length === 0) {
		const hiddenActions: RoomToolboxHiddenSection[] = [];
		if (appActions.length > 0) {
			hiddenActions.push({ id: 'apps', items: appActions });
		}
		return {
			featuredActions: [],
			visibleActions: nonAppActions,
			hiddenActions,
		};
	}

	const itemMap = new Map(config.items.map((item) => [item.id, item]));

	const featuredWithOrder: { action: RoomToolboxBaseAction; order: number }[] = [];
	const normalWithOrder: { action: RoomToolboxBaseAction; order: number }[] = [];

	nonAppActions.forEach((action) => {
		const configItem = itemMap.get(action.id);

		if (configItem) {
			if (configItem.featured) {
				featuredWithOrder.push({ action, order: configItem.order });
			} else {
				normalWithOrder.push({ action, order: configItem.order });
			}
		} else {
			normalWithOrder.push({ action, order: 9999 });
		}
	});

	featuredWithOrder.sort((a, b) => a.order - b.order);
	normalWithOrder.sort((a, b) => a.order - b.order);

	const maxVisible = Math.max(0, Math.floor(config.maxVisibleNormal ?? 6));
	const visibleActions = normalWithOrder.slice(0, maxVisible).map((n) => n.action);
	const overflowNormalActions = normalWithOrder.slice(maxVisible).map((n) => n.action);

	const hiddenActions: RoomToolboxHiddenSection[] = [];

	if (appActions.length > 0) {
		hiddenActions.push({ id: 'apps', items: appActions });
	}

	if (overflowNormalActions.length > 0) {
		hiddenActions.push({ id: 'overflow', items: overflowNormalActions });
	}

	return {
		featuredActions: featuredWithOrder.map((n) => n.action),
		visibleActions,
		hiddenActions,
	};
};
