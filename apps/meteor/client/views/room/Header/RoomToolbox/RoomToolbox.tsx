import type { Box } from '@rocket.chat/fuselage';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { HeaderToolboxAction, HeaderToolboxDivider } from '@rocket.chat/ui-client';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import type { RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';

type RoomToolboxProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const RoomToolbox = ({ className }: RoomToolboxProps) => {
	const t = useTranslation();
	const { isMobile } = useLayout();

	const toolbox = useRoomToolbox();
	const { actions, openTab } = toolbox;

	const featuredActions = actions.filter((action) => action.featured);
	const normalActions = actions.filter((action) => !action.featured);
	const visibleActions = isMobile ? [] : normalActions.slice(0, 6);
	const hiddenActions: Record<string, RoomToolboxActionConfig> = Object.fromEntries(
		(isMobile ? actions : normalActions.slice(6))
			.filter((item) => !item.disabled)
			.map((item) => {
				return [
					item.id,
					{
						label: { title: t(item.title), icon: item.icon },
						action: (): void => {
							openTab(item.id);
						},
						...item,
					},
				];
			}),
	);

	const renderDefaultToolboxItem: RoomToolboxActionConfig['renderToolboxItem'] = useMutableCallback(
		({ id, className, index, icon, title, toolbox: { tab }, action, disabled, tooltip }) => {
			return (
				<HeaderToolboxAction
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
			{featuredActions.length > 0 && <HeaderToolboxDivider />}
			{visibleActions.map(mapToToolboxItem)}
			{(normalActions.length > 6 || isMobile) && (
				<Menu
					data-qa-id='ToolBox-Menu'
					tiny={!isMobile}
					title={t('Options')}
					maxHeight='initial'
					className={className}
					aria-keyshortcuts='alt'
					tabIndex={-1}
					options={hiddenActions}
					renderItem={({ label: { title, icon }, ...props }) => (
						<Option label={title} icon={icon} data-qa-id={`ToolBoxAction-${icon}`} gap={!icon} {...props} />
					)}
				/>
			)}
		</>
	);
};

export default memo(RoomToolbox);
