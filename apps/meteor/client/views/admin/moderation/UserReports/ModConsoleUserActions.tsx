import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import useDeactivateUserAction from '../hooks/useDeactivateUserAction';
import useDismissUserAction from '../hooks/useDismissUserAction';
import useResetAvatarAction from '../hooks/useResetAvatarAction';
import type { ModConsoleUserRowProps } from './ModConsoleUserTableRow';

const ModConsoleUserActions = ({ report, onClick }: Omit<ModConsoleUserRowProps, 'isDesktopOrLarger'>) => {
	const t = useTranslation();
	const {
		reportedUser: { _id: uid },
	} = report;

	return (
		<>
			<GenericMenu
				title={t('Options')}
				sections={[
					{
						items: [
							{
								id: 'seeReports',
								content: t('Moderation_See_reports'),
								icon: 'document-eye',
								onClick: () => onClick(uid),
							},
						],
					},
					{
						items: [useDismissUserAction(uid, true), useDeactivateUserAction(uid, true), useResetAvatarAction(uid)],
					},
				]}
				placement='bottom-end'
			/>
		</>
	);
};

export default ModConsoleUserActions;
