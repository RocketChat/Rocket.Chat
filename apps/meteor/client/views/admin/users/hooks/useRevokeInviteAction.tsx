import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import type { Action } from '../../../hooks/useActionSpread';

export const useRevokeInviteAction = (onReload: () => void): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const userRoute = useRoute('admin-users');
	// TODO: check if permission should have different roles
	const canRevokeInvite = usePermission('revoke-invite');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRevokeInvite = (): void => {
		setModal();
		userRoute.push({});
		onReload();
	};

	// TODO: add endpoint and query to revoke Invite!
	const revokeInviteEndpoint = useEndpoint('POST', '/v1/');
	const revokeInviteQuery = '';

	const revokeInvite = async (): Promise<void> => {
		try {
			await revokeInviteEndpoint(revokeInviteQuery);
			dispatchToastMessage({ type: 'success', message: t('Invitation_revoked') });
			handleRevokeInvite();
		} catch (error) {
			throw error;
		}
	};

	const confirmRevokeInvite = useMutableCallback(() => {
		setModal(
			<GenericModal variant='danger' onConfirm={revokeInvite} onCancel={(): void => setModal()} confirmText={t('Revoke')}>
				{t('Invitation_link_will_become_invalid')}
			</GenericModal>,
		);
	});

	return canRevokeInvite
		? {
				icon: 'ban',
				label: t('Revoke'),
				action: confirmRevokeInvite,
		  }
		: undefined;
};
