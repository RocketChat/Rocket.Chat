import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig, RoomToolboxContextValue } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveLayoutForRoomType } from './parseLayoutSetting';
import { processRoomActions } from './processRoomActions';
import type { RoomToolboxBaseAction } from './processRoomActions';
import { useRoom } from '../../../contexts/RoomContext';

type MenuSection = {
	id: string;
	title?: string;
	items: GenericMenuItemProps[];
};

const canRenderAsMenuItem = (item: RoomToolboxActionConfig): boolean => Boolean(item.action ?? item.tabComponent);

const isSelfRendering = (item: RoomToolboxActionConfig): boolean => Boolean(item.renderToolboxItem) && !canRenderAsMenuItem(item);

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
	const room = useRoom();
	const isLayoutPreviewEnabled = useFeaturePreview('roomToolboxLayout');

	const layoutSettingJSON = useSetting('Room_Toolbox_Layout', '');

	const layoutConfig = useMemo(() => {
		if (!isLayoutPreviewEnabled) {
			return null;
		}
		return resolveLayoutForRoomType(layoutSettingJSON, room.t);
	}, [isLayoutPreviewEnabled, layoutSettingJSON, room.t]);

	if (isLayoutPreviewEnabled && layoutConfig) {
		const { featuredActions, visibleActions: engineVisible, hiddenActions: engineSections } = processRoomActions(actions, layoutConfig);

		const typedFeatured = featuredActions as RoomToolboxActionConfig[];
		const typedVisible = engineVisible as RoomToolboxActionConfig[];
		const overflowActions = engineSections.flatMap((section) => section.items as RoomToolboxActionConfig[]);

		if (!roomToolboxExpanded) {
			const pinnedSelfRendering = [...typedVisible, ...overflowActions].filter(isSelfRendering);

			const orderedOverflowActions = [...typedVisible, ...overflowActions].filter((item) => !item.disabled && canRenderAsMenuItem(item));

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

			return { featuredActions: [...typedFeatured, ...pinnedSelfRendering], visibleActions: [], hiddenActions };
		}

		const hiddenActions = engineSections
			.map((section) => ({
				id: section.id,
				title: section.id === 'apps' ? t('Apps') : '',
				items: (section.items as RoomToolboxActionConfig[])
					.filter((item) => !item.disabled && canRenderAsMenuItem(item))
					.map((item) => actionToMenuItem(item, openTab, t)),
			}))
			.filter((section) => section.items.length > 0);

		const rescuedFromOverflow = overflowActions.filter(isSelfRendering);

		return { featuredActions: typedFeatured, visibleActions: [...typedVisible, ...rescuedFromOverflow], hiddenActions };
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
