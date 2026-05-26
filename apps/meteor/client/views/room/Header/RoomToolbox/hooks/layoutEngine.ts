import type { RoomToolboxLayoutConfig, RoomToolboxBaseAction } from './layoutEngine.types';

export const processActions = (actionsBase: RoomToolboxBaseAction[], config: RoomToolboxLayoutConfig | null) => {
	if (!config || !config.items || config.items.length === 0) {
		return {
			featuredActions: [],
			visibleActions: actionsBase,
			hiddenActions: [],
		};
	}

	const { items } = config;

	const featuredActions: RoomToolboxBaseAction[] = [];
	const normalActions: RoomToolboxBaseAction[] = [];
	const appActions: RoomToolboxBaseAction[] = [];

	actionsBase.forEach((action) => {
		if (action.type === 'apps') {
			appActions.push(action);
			return;
		}

		const configItem = items.find((item) => item.id === action.id);

		if (configItem) {
			if (configItem.featured) {
				featuredActions.push(action);
			} else {
				normalActions.push({ ...action, order: configItem.order });
			}
		} else {
			normalActions.push({ ...action, order: 9999 });
		}
	});

	normalActions.sort((a, b) => (a.order as number) - (b.order as number));

	const maxVisible = config.maxVisibleNormal ?? 6;
	const visibleActions = normalActions.slice(0, maxVisible);

	const overflowNormalActions = normalActions.slice(maxVisible);

	const hiddenActions = [];

	if (appActions.length > 0) {
		hiddenActions.push({
			id: 'apps',
			items: appActions,
		});
	}

	if (overflowNormalActions.length > 0) {
		hiddenActions.push({
			id: 'overflow',
			items: overflowNormalActions,
		});
	}

	return {
		featuredActions,
		visibleActions,
		hiddenActions,
	};
};
