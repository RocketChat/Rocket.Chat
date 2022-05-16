import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, FC, ComponentProps } from 'react';

import Header from '../../../../../components/Header';
import { useQuickActions } from './hooks/useQuickActions';

type QuickActionsProps = {
	room: IOmnichannelRoom;
	className?: ComponentProps<typeof Box>['className'];
};

const QuickActions: FC<QuickActionsProps> = ({ room, className }) => {
	const t = useTranslation();
	const { visibleActions, actionDefault } = useQuickActions(room);

	return (
		<ButtonGroup mi='x4' medium>
			{visibleActions.map(({ id, color, icon, title, action = actionDefault }, index) => {
				const props = {
					id,
					icon,
					color,
					'title': t(title),
					className,
					index,
					'primary': false,
					'data-quick-actions': index,
					action,
					'key': id,
				};

				return <Header.ToolBoxAction {...props} />;
			})}
		</ButtonGroup>
	);
};

export default memo(QuickActions);
