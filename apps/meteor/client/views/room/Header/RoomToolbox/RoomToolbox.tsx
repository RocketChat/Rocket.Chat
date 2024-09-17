import type { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import { HeaderToolbarAction, HeaderToolbarDivider } from '../../../../components/Header';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import type { RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';

type RoomToolboxProps = {
	className?: ComponentProps<typeof Box>['className'];
};

type MenuActionsProps = {
	id: string;
	items: GenericMenuItemProps[];
}[];

const RoomToolbox = ({ className }: RoomToolboxProps) => {
	const t = useTranslation();
	const { roomToolboxExpanded } = useLayout();

	const toolbox = useRoomToolbox();
	const { actions, openTab } = toolbox;

	const featuredActions = actions.filter((action) => action.featured);
	const normalActions = actions.filter((action) => !action.featured);
	const visibleActions = !roomToolboxExpanded ? [] : normalActions.slice(0, 6);

	const hiddenActions = (!roomToolboxExpanded ? actions : normalActions.slice(6))
		.filter((item) => !item.disabled && !item.featured)
		.map((item) => ({
			'key': item.id,
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

			const newSection = { id: group, key: item.key, title: group === 'apps' ? t('Apps') : '', items: [item] };
			acc.push(newSection);

			return acc;
		}, [] as MenuActionsProps);

	const renderDefaultToolboxItem: RoomToolboxActionConfig['renderToolboxItem'] = useMutableCallback(
		({ id, className, index, icon, title, toolbox: { tab }, action, disabled, tooltip }) => {
			return (
				<HeaderToolbarAction
					key={id}
					className={className}
					index={index}
					id={id}
					icon={icon}
					title={t(title)}
					pressed={id === tab?.id}
					action={action}
					disabled={disabled}
					tooltip={tooltip}
				/>
			);
		},
	);

	const mapToToolboxItem = (action: RoomToolboxActionConfig, index: number) => {
		return (action.renderToolboxItem ?? renderDefaultToolboxItem)?.({
			...action,
			action: action.action ?? (() => toolbox.openTab(action.id)),
			className,
			index,
			toolbox,
		});
	};

	return (
		<>
			{featuredActions.map(mapToToolboxItem)}
			{featuredActions.length > 0 && <HeaderToolbarDivider />}
			{visibleActions.map(mapToToolboxItem)}
			{(normalActions.length > 6 || !roomToolboxExpanded) && !!hiddenActions.length && (
				<GenericMenu title={t('Options')} data-qa-id='ToolBox-Menu' sections={hiddenActions} placement='bottom-end' />
			)}
		</>
	);
};

export default memo(RoomToolbox);
