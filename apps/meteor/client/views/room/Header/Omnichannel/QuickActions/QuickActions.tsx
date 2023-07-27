import type { Box } from '@rocket.chat/fuselage';
import { HeaderToolbox, HeaderToolboxAction, HeaderToolboxDivider } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import { useOmnichannelRoom } from '../../../contexts/RoomContext';
import ToolBoxActionOptions from './ToolBoxActionOptions';
import { useQuickActions } from './hooks/useQuickActions';

type QuickActionsProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const QuickActions = ({ className }: QuickActionsProps) => {
	const t = useTranslation();
	const room = useOmnichannelRoom();
	const { visibleActions, actionDefault } = useQuickActions();

	return (
		<HeaderToolbox aria-label={t('Omnichannel_quick_actions')}>
			{visibleActions.map(({ id, color, icon, title, action = actionDefault, options }, index) => {
				const props = {
					id,
					icon,
					color,
					title: t(title),
					className,
					index,
					primary: false,
					action,
					room,
				};

				if (options) {
					return <ToolBoxActionOptions options={options} {...props} key={id} />;
				}

				return <HeaderToolboxAction {...props} key={id} />;
			})}
			{visibleActions.length > 0 && <HeaderToolboxDivider />}
		</HeaderToolbox>
	);
};

export default memo(QuickActions);
