import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { RoomToolboxContextValue } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type MenuActionsProps = {
	id: string;
	items: GenericMenuItemProps[];
}[];

export const useRoomToolboxActions = ({ actions, openTab }: Pick<RoomToolboxContextValue, 'actions' | 'openTab'>) => {
	const { t } = useTranslation();
	const { roomToolboxExpanded } = useLayout();

	// 1. Fetch the admin-defined order from settings
	const customOrderSetting = (useSetting('Room_Header_Toolbox_Action_Order') as string) || '';

	// 2. Filter actions into categories
	const normalActions = actions.filter((action) => !action.featured && action.type !== 'apps');
	const featuredActions = actions.filter((action) => action.featured);
	const appsActions = actions.filter((action) => action.type === 'apps');

	// 3. APPLY THE LAYOUT ENGINE: Sort based on the setting
	const sortedActions = [...normalActions].sort((a, b) => {
		if (!customOrderSetting) return 0;

		const orderArray = customOrderSetting.split(',').map((id) => id.trim());
		const indexA = orderArray.indexOf(a.id);
		const indexB = orderArray.indexOf(b.id);

		// If an ID isn't in the list, move it to the end
		const weightA = indexA === -1 ? 999 : indexA;
		const weightB = indexB === -1 ? 999 : indexB;

		return weightA - weightB;
	});

	// 4. Decide visibility based on the sorted list
	const visibleActions = !roomToolboxExpanded ? [] : sortedActions.slice(0, 6);

	const hiddenActions = (!roomToolboxExpanded ? actions : [...appsActions, ...sortedActions.slice(6)])
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
		}, [] as MenuActionsProps);

	return { hiddenActions, featuredActions, visibleActions };
};
