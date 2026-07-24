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

const groupActionsByType = (actions: RoomToolboxBaseAction[]): RoomToolboxHiddenSection[] => {
	const sectionsMap = new Map<string, RoomToolboxHiddenSection>();
	for (const action of actions) {
		const group = action.type ?? '';
		const existing = sectionsMap.get(group);
		if (existing) {
			existing.items.push(action);
		} else {
			sectionsMap.set(group, { id: group, items: [action] });
		}
	}
	return Array.from(sectionsMap.values());
};

export const processRoomActions = (actionsBase: RoomToolboxBaseAction[], config: RoomToolboxLayoutConfig | null) => {
	const appActions = actionsBase.filter((a) => a.type === 'apps');
	const nonAppActions = actionsBase.filter((a) => a.type !== 'apps');

	if (!config) {
		const hiddenActions: RoomToolboxHiddenSection[] = [];
		if (appActions.length > 0) {
			hiddenActions.push({ id: 'apps', items: appActions });
		}
		return {
			featuredActions: [] as RoomToolboxBaseAction[],
			visibleActions: nonAppActions,
			hiddenActions,
		};
	}

	const itemMap = new Map((config.items || []).map((item) => [item.id, item]));

	const [featuredWithOrder, normalWithOrder] = nonAppActions.reduce<
		[{ action: RoomToolboxBaseAction; order: number }[], { action: RoomToolboxBaseAction; order: number }[]]
	>(
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

	const hiddenActions: RoomToolboxHiddenSection[] = [];

	if (appActions.length > 0) {
		hiddenActions.push({ id: 'apps', items: appActions });
	}

	hiddenActions.push(...groupActionsByType(overflowNormalActions));

	return {
		featuredActions: featuredWithOrder.map((n) => n.action),
		visibleActions,
		hiddenActions,
	};
};
