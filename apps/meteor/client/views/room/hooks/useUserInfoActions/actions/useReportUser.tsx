import type { IUser } from '@rocket.chat/core-typings';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ReportUserModal from '../../../contextualBar/UserInfo/ReportUserModal';
import type { UserInfoAction } from '../useUserInfoActions';

export const useReportUser = (user: Pick<IUser, '_id' | 'username' | 'name'>): UserInfoAction | undefined => {
	const { _id: uid, username, name } = user;
	const ownUserId = useUserId();
	const setModal = useSetModal();

	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const displayName = useUserDisplayName({ username, name });

	const reportUser = useEndpoint('POST', '/v1/moderation.reportUser');
	const reportUserMutation = useMutation({
		mutationKey: ['reportUser', uid],

		mutationFn: async (description: string) => {
			reportUser({ description, userId: uid });
		},

		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Report_has_been_sent') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		onSettled: () => setModal(),
	});

	const openReportUserModal = useMemo(() => {
		const action = () =>
			setModal(
				<ReportUserModal
					onConfirm={reportUserMutation.mutate}
					onClose={() => setModal()}
					displayName={displayName || ''}
					username={username || ''}
				/>,
			);

		return ownUserId !== uid
			? {
					icon: 'warning' as const,
					content: t('Report'),
					onClick: action,
					type: 'moderation' as const,
					variant: 'danger' as const,
				}
			: undefined;
	}, [ownUserId, uid, t, setModal, username, reportUserMutation.mutate, displayName]);

	return openReportUserModal;
};
