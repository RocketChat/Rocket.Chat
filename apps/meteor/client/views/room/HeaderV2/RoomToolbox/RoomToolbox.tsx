import type { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomToolboxActions } from './hooks/useRoomToolboxActions';
import { HeaderToolbarAction, HeaderToolbarDivider } from '../../../../components/Header';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import type { RenderToolboxItemParams, RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';

type RoomToolboxProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const RoomToolbox = ({ className }: RoomToolboxProps) => {
	const { t } = useTranslation();

	const toolbox = useRoomToolbox();
	const { featuredActions, hiddenActions, visibleActions } = useRoomToolboxActions(toolbox);

	const showKebabMenu = hiddenActions.length > 0;

	const renderDefaultToolboxItem = useEffectEvent(
		({ id, className, icon, title, toolbox: { tab }, action, disabled, tooltip }: RenderToolboxItemParams) => {
			return (
				<HeaderToolbarAction
					key={id}
					className={className}
					icon={icon}
					title={t(title)}
					pressed={id === tab?.id}
					onClick={action}
					disabled={disabled}
					tooltip={tooltip}
				/>
			);
		},
	);

	const mapToToolboxItem = (action: RoomToolboxActionConfig) => {
		return (action.renderToolboxItem ?? renderDefaultToolboxItem)?.({
			...action,
			action: action.action ?? (() => toolbox.openTab(action.id)),
			className,
			toolbox,
		});
	};

	return (
		<>
			{featuredActions.map(mapToToolboxItem)}
			{featuredActions.length > 0 && <HeaderToolbarDivider />}
			{visibleActions.map(mapToToolboxItem)}
			{showKebabMenu && <GenericMenu title={t('Options')} sections={hiddenActions} placement='bottom-end' />}
		</>
	);
};

export default memo(RoomToolbox);
