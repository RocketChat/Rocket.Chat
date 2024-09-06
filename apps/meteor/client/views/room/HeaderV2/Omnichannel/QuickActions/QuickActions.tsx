import type { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import { HeaderToolbar, HeaderToolbarAction, HeaderToolbarDivider } from '../../../../../components/Header';
import { useOmnichannelRoom } from '../../../contexts/RoomContext';
import QuickActionOptions from './QuickActionOptions';
import { useQuickActions } from './hooks/useQuickActions';

type QuickActionsProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const QuickActions = ({ className }: QuickActionsProps) => {
	const t = useTranslation();
	const room = useOmnichannelRoom();
	const { quickActions, actionDefault } = useQuickActions();

	return (
		<HeaderToolbar aria-label={t('Omnichannel_quick_actions')}>
			{quickActions.map(({ id, color, icon, title, action = actionDefault, options }, index) => {
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
					return <QuickActionOptions options={options} {...props} key={id} />;
				}

				return <HeaderToolbarAction {...props} key={id} />;
			})}
			{quickActions.length > 0 && <HeaderToolbarDivider />}
		</HeaderToolbar>
	);
};

export default memo(QuickActions);
