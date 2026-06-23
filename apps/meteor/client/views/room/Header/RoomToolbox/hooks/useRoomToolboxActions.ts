import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig, RoomToolboxContextValue } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { processRoomActions } from './processRoomActions';
import type { RoomToolboxBaseAction, RoomToolboxLayoutConfig } from './processRoomActions';

type MenuSection = {
	id: string;
	title?: string;
	items: GenericMenuItemProps[];
};

const parseLayoutConfig = (raw: string): RoomToolboxLayoutConfig | null => {
	if (!raw) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			return null;
		}
		if (Array.isArray(parsed.items)) {
			const items = parsed.items as unknown[];
			const validItems = items.every((item: unknown): boolean => {
				if (typeof item !== 'object' || item === null) {
					return false;
				}
				const candidate = item as Record<string, unknown>;
				return (
					typeof candidate.id === 'string' &&
					(candidate.featured === undefined || typeof candidate.featured === 'boolean') &&
					(candidate.order === undefined || (typeof candidate.order === 'number' && Number.isFinite(candidate.order)))
				);
			});
			if (!validItems) {
				return null;
			}
		} else if (parsed.items !== undefined) {
			return null;
		}
		if (
			parsed.maxVisibleNormal !== undefined &&
			(typeof parsed.maxVisibleNormal !== 'number' || !Number.isFinite(parsed.maxVisibleNormal))
		) {
			return null;
		}
		return parsed as RoomToolboxLayoutConfig;
	} catch {
		return null;
	}
};

const actionToMenuItem = (
	item: RoomToolboxBaseAction,
	openTab: RoomToolboxContextValue['openTab'],
	t: (key: string) => string,
): GenericMenuItemProps => ({
	...(item as Record<string, unknown>),
	id: item.id,
	content: t(item.title as string),
	onClick:
		(item.action as (() => void) | undefined) ??
		((): void => {
			openTab(item.id);
		}),
});

export const useRoomToolboxActions = ({ actions, openTab }: Pick<RoomToolboxContextValue, 'actions' | 'openTab'>) => {
	const { t } = useTranslation();
	const { roomToolboxExpanded } = useLayout();
	const layoutConfigJSON = useSetting('Room_Toolbox_Layout', '');
	const isLayoutPreviewEnabled = useFeaturePreview('roomToolboxLayout');

	const layoutConfig = useMemo(
		() => (isLayoutPreviewEnabled ? parseLayoutConfig(layoutConfigJSON) : null),
		[isLayoutPreviewEnabled, layoutConfigJSON],
	);

	if (isLayoutPreviewEnabled && layoutConfig) {
		const { featuredActions, visibleActions: engineVisible, hiddenActions: engineSections } = processRoomActions(actions, layoutConfig);

		const typedFeatured = featuredActions as RoomToolboxActionConfig[];
		const typedVisible = engineVisible as RoomToolboxActionConfig[];

		if (!roomToolboxExpanded) {
			const orderedOverflowActions = [...typedVisible, ...engineSections.flatMap((section) => section.items as RoomToolboxActionConfig[])].filter((item) => !item.disabled);

			const sectionsMap = new Map<string, MenuSection>();
			for (const item of orderedOverflowActions) {
				const group = item.type ?? '';
				const menuItem = actionToMenuItem(item, openTab, t);
				const existing = sectionsMap.get(group);
				if (existing) {
					existing.items.push(menuItem);
				} else {
					sectionsMap.set(group, {
						id: group,
						title: group === 'apps' ? t('Apps') : '',
						items: [menuItem],
					});
				}
			}
			const hiddenActions = Array.from(sectionsMap.values());

			return { featuredActions: typedFeatured, visibleActions: [], hiddenActions };
		}

		const hiddenActions = engineSections.map((section) => ({
			id: section.id,
			title: section.id === 'apps' ? t('Apps') : '',
			items: (section.items as RoomToolboxActionConfig[])
				.filter((item) => !item.disabled)
				.map((item) => actionToMenuItem(item, openTab, t)),
		}));

		return { featuredActions: typedFeatured, visibleActions: typedVisible, hiddenActions };
	}

	const normalActions = actions.filter((action) => !action.featured && action.type !== 'apps');
	const featuredActions = actions.filter((action) => action.featured);
	const appsActions = actions.filter((action) => action.type === 'apps');
	const visibleActions = !roomToolboxExpanded ? [] : normalActions.slice(0, 6);

	const hiddenActions = (!roomToolboxExpanded ? actions : [...appsActions, ...normalActions.slice(6)])
		.filter((item) => !item.disabled && !item.featured)
		.map((item) => ({
			content: t(item.title),
			onClick:
				item.action ??
				((): void => {
					openTab(item.id);
				}),
			...item,
		}))
		.reduce((acc, item) => {
			const group = item.type ? item.type : '';
			const section = acc.find((section: { id: string }) => section.id === group);
			if (section) {
				section.items.push(item);
				return acc;
			}

			const newSection = { id: group, title: group === 'apps' ? t('Apps') : '', items: [item] };
			acc.push(newSection);

			return acc;
		}, [] as MenuSection[]);

	return { hiddenActions, featuredActions, visibleActions };
};
