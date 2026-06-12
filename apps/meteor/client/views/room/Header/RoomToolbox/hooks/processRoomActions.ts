export type RoomToolboxLayoutItem = {
	id: string;
	featured: boolean;
	order: number;
};

export type RoomToolboxLayoutConfig = {
	maxVisibleNormal?: number;
	items?: RoomToolboxLayoutItem[];
};

export type RoomToolboxBaseAction = {
	id: string;
	type?: string;
	[key: string]: unknown;
};

export type RoomToolboxHiddenSection = {
	id: string;
	items: RoomToolboxBaseAction[];
};

export const processRoomActions = <T extends RoomToolboxBaseAction>(actionsBase: T[], config: RoomToolboxLayoutConfig | null) => {
	const appActions = actionsBase.filter((a) => a.type === 'apps');
	const nonAppActions = actionsBase.filter((a) => a.type !== 'apps');

	if (!config?.items || config.items.length === 0) {
		const hiddenActions: { id: string; items: T[] }[] = [];
		if (appActions.length > 0) {
			hiddenActions.push({ id: 'apps', items: appActions });
		}
		return {
			featuredActions: [] as T[],
			visibleActions: nonAppActions,
			hiddenActions,
		};
	}

	const itemMap = new Map(config.items.map((item) => [item.id, item]));

	const [featuredWithOrder, normalWithOrder] = nonAppActions.reduce<[{ action: T; order: number }[], { action: T; order: number }[]]>(
		(acc, action) => {
			const configItem = itemMap.get(action.id);
			if (configItem?.featured) {
				acc[0].push({ action, order: configItem.order });
			} else {
				acc[1].push({ action, order: configItem?.order ?? 9999 });
			}
			return acc;
		},
		[[], []],
	);

	featuredWithOrder.sort((a, b) => a.order - b.order);
	normalWithOrder.sort((a, b) => a.order - b.order);

	const maxVisible = Math.max(0, Math.floor(config.maxVisibleNormal ?? 6));
	const visibleActions = normalWithOrder.slice(0, maxVisible).map((n) => n.action);
	const overflowNormalActions = normalWithOrder.slice(maxVisible).map((n) => n.action);

	const hiddenActions: { id: string; items: T[] }[] = [];

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
