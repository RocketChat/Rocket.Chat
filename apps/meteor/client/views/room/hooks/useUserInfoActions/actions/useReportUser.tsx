import type { IUser } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Action } from '../../../../hooks/useActionSpread';
import ReportUserModal from '../../../contextualBar/UserInfo/ReportUserModal';

export const useReportUser = (user: Pick<IUser, '_id' | 'username' | 'name'>): Action | undefined => {
	const { _id: uid, username, name } = user;
	const ownUserId = useUserId();
	const setModal = useSetModal();

	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const reportUser = useEndpoint('POST', '/v1/moderation.reportUser');
	const reportUserMutation = useMutation(
		['reportUser', uid],
		async (description: string) => {
			reportUser({ description, userId: uid });
		},
		{ onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Report_has_been_sent') }) },
	);

	const openReportUserModal = useMemo(() => {
		const action = () =>
			setModal(
				<ReportUserModal
					uid={uid}
					username={username || ''}
					onConfirm={reportUserMutation.mutate}
					name={name}
					onClose={() => setModal()}
				/>,
			);

		return ownUserId !== uid
			? {
					label: (
						<Box color='status-font-on-danger'>
							<Icon mie='x4' name='warning' size='x20' />
							{t('Report_User')}
						</Box>
					),
					action,
			  }
			: undefined;
	}, [ownUserId, uid, t, setModal, username, reportUserMutation.mutate, name]);

	return openReportUserModal;
};
