import type { Box } from '@rocket.chat/fuselage';
import { HeaderToolbar, HeaderToolbarAction, HeaderToolbarDivider } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import QuickActionOptions from './QuickActionOptions';
import { useQuickActions } from './hooks/useQuickActions';
import { useOmnichannelRoom } from '../../../contexts/RoomContext';

type QuickActionsProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const QuickActions = ({ className }: QuickActionsProps) => {
	const { t } = useTranslation();
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
					room,
				};

				if (options) {
					return <QuickActionOptions options={options} key={id} action={action} {...props} />;
				}

				return <HeaderToolbarAction key={id} onClick={() => action(id)} {...props} />;
			})}
			{quickActions.length > 0 && <HeaderToolbarDivider />}
		</HeaderToolbar>
	);
};

export default memo(QuickActions);
