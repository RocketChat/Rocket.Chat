import { SidebarBanner } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRole, useRoute, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../components/GenericModal';

const StatusDisabledSection = ({ onDismiss }: { onDismiss: () => void }) => {
	const t = useTranslation();
	const userStatusRoute = useRoute('user-status');
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const handleGoToSettings = useMutableCallback(() => {
		userStatusRoute.push({});
		closeModal();
	});
	const isAdmin = useRole('admin');

	return (
		<SidebarBanner
			text={t('User_status_temporarily_disabled')}
			description={t('Learn_more')}
			onClose={onDismiss}
			onClick={() =>
				setModal(
					isAdmin ? (
						<GenericModal
							title={t('User_status_disabled_learn_more')}
							cancelText={t('Close')}
							confirmText={t('Go_to_workspace_settings')}
							children={t('User_status_disabled_learn_more_description')}
							onConfirm={handleGoToSettings}
							onClose={closeModal}
							onCancel={closeModal}
							icon={null}
							variant='warning'
						/>
					) : (
						<GenericModal
							title={t('User_status_disabled_learn_more')}
							confirmText={t('Close')}
							children={t('User_status_disabled_learn_more_description')}
							onConfirm={closeModal}
							onClose={closeModal}
							icon={null}
						/>
					),
				)
			}
		/>
	);
};

export default StatusDisabledSection;
