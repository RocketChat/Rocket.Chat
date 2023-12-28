import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import type { Action } from '../../../hooks/useActionSpread';

export const useResendInviteAction = (onReload: () => void): Action | undefined => {
	const t = useTranslation();
	const setModal = useSetModal();
	const userRoute = useRoute('admin-users');
	// TODO: check if permission should have different roles
	const canResendInvite = usePermission('resend-invite');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleResendInvite = (): void => {
		setModal();
		userRoute.push({});
		onReload();
	};

	// TODO: add endpoint and query to resend Invite!
	const resendInviteEndpoint = useEndpoint('POST', '/v1/');
	const resendInviteQuery = '';

	const resendInvite = async (): Promise<void> => {
		try {
			// TODO: time count should happen on frontend or backend?
			// TODO: add error toasts
			await resendInviteEndpoint(resendInviteQuery);
			dispatchToastMessage({ type: 'success', message: t('Invitation_resent') });
			handleResendInvite();
		} catch (error) {
			throw error;
		}
	};

	return canResendInvite
		? {
				icon: 'mail',
				label: t('Resend'),
				action: resendInvite,
		  }
		: undefined;
};
