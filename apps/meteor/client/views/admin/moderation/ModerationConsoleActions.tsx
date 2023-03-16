import { Menu, Option } from '@rocket.chat/fuselage';
import React from 'react';

import type { MonderationConsoleRowProps } from './ModerationConsoleTableRow';
import useApproveUserAction from './hooks/useApproveUserAction';
import useDeactivateUserAction from './hooks/useDeactivateUserAction';
import useDeleteMessagesAction from './hooks/useDeleteMessagesAction';
import useResetAvatarAction from './hooks/useResetAvatarAction';

const ModerationConsoleActions = ({ report, onClick, onChange, onReload }: MonderationConsoleRowProps): JSX.Element => {
	const { userId: uid } = report;

	return (
		<>
			<Menu
				options={{
					seeReports: {
						label: { label: 'View Messages', icon: 'document-eye' },
						action: () => onClick(uid),
					},
					divider: {
						type: 'divider',
					},
					approve: useApproveUserAction(uid, onChange, onReload),
					deleteAll: useDeleteMessagesAction(uid, onChange, onReload),
					deactiveUser: useDeactivateUserAction(uid, onChange, onReload),
					resetAvatar: useResetAvatarAction(uid, onChange, onReload),
				}}
				renderItem={({ label: { label, icon }, ...props }): JSX.Element => <Option label={label} icon={icon} {...props} />}
			/>
		</>
	);
};

export default ModerationConsoleActions;
