import type { IModerationAudit, IUser } from '@rocket.chat/core-typings';
import { Menu, Option } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import useDeactivateUserAction from './hooks/useDeactivateUserAction';
import useDeleteMessagesAction from './hooks/useDeleteMessagesAction';
import useDismissUserAction from './hooks/useDismissUserAction';
import useResetAvatarAction from './hooks/useResetAvatarAction';

type MCRowActions = {
	report: IModerationAudit;
	onClick: (id: IUser['_id']) => void;
	isUserDeleted: boolean;
};

const ModerationConsoleActions = ({ report, onClick, isUserDeleted }: MCRowActions): JSX.Element => {
	const t = useTranslation();
	const { userId: uid } = report;

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
					deactiveUser: useDeactivateUserAction(uid, isUserDeleted),
					resetAvatar: useResetAvatarAction(uid, isUserDeleted),
				}}
				renderItem={({ label: { label, icon }, ...props }) => <Option label={label} icon={icon} {...props} />}
			/>
		</>
	);
};

export default ModerationConsoleActions;
