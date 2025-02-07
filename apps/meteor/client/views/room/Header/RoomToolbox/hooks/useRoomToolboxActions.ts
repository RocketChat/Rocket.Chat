import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { RoomToolboxContextValue } from '../../../contexts/RoomToolboxContext';

type MenuActionsProps = {
	id: string;
	items: GenericMenuItemProps[];
}[];

export const useRoomToolboxActions = ({ actions, openTab }: Pick<RoomToolboxContextValue, 'actions' | 'openTab'>) => {
	const { t } = useTranslation();
	const { roomToolboxExpanded } = useLayout();

	const normalActions = actions.filter((action) => !action.featured && action.type !== 'apps');
	const featuredActions = actions.filter((action) => action.featured);
	const appsActions = actions.filter((action) => action.type === 'apps');
	const visibleActions = !roomToolboxExpanded ? [] : normalActions.slice(0, 6);

	const hiddenActions = (!roomToolboxExpanded ? actions : [...appsActions, ...normalActions.slice(6)])
		.filter((item) => !item.disabled && !item.featured)
		.map((item) => ({
			'content': t(item.title),
			'onClick':
				item.action ??
				((): void => {
					openTab(item.id);
				}),
			'data-qa-id': `ToolBoxAction-${item.icon}`,
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
		}, [] as MenuActionsProps);

	return { hiddenActions, featuredActions, visibleActions };
};
