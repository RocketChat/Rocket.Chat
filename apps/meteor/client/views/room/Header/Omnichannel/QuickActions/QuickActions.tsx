import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps } from 'react';
import React, { memo } from 'react';

import { useQuickActions } from './hooks/useQuickActions';

type QuickActionsProps = {
	room: IOmnichannelRoom;
	className?: ComponentProps<typeof Box>['className'];
};

const QuickActions: FC<QuickActionsProps> = ({ room, className }) => {
	const t = useTranslation();
	const { visibleActions, actionDefault } = useQuickActions(room);

	return (
		<Header.ToolBox aria-label={t('Omnichannel_quick_actions')}>
			{visibleActions.map(({ id, color, icon, title, action = actionDefault }, index) => {
				const props = {
					id,
					icon,
					color,
					title: t(title),
					className,
					index,
					primary: false,
					action,
					key: id,
				};

				return <Header.ToolBox.Action {...props} />;
			})}
		</Header.ToolBox>
	);
};

export default memo(QuickActions);
