import { Menu, Option } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { ModerationConsoleRowProps } from './ModerationConsoleTableRow';
import useDeactivateUserAction from './hooks/useDeactivateUserAction';
import useDeleteMessagesAction from './hooks/useDeleteMessagesAction';
import useDismissUserAction from './hooks/useDismissUserAction';
import useResetAvatarAction from './hooks/useResetAvatarAction';

const ModerationConsoleActions = ({ report, onClick }: Omit<ModerationConsoleRowProps, 'isDesktopOrLarger'>): JSX.Element => {
	const t = useTranslation();
	const { userId: uid, isUserDeleted } = report;

	return (
		<>
			<Menu
				options={{
					seeReports: {
						label: { label: t('Moderation_See_messages'), icon: 'document-eye' },
						action: () => onClick(uid),
					},
					divider: {
						type: 'divider',
					},
					approve: useDismissUserAction(uid),
					deleteAll: useDeleteMessagesAction(uid),
					deactiveUser: { ...useDeactivateUserAction(uid), ...(isUserDeleted && { disabled: true }) },
					resetAvatar: { ...useResetAvatarAction(uid), ...(isUserDeleted && { disabled: true }) },
				}}
				renderItem={({ label: { label, icon }, ...props }) => <Option label={label} icon={icon} {...props} />}
			/>
		</>
	);
};

export default ModerationConsoleActions;
