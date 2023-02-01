import { Box, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../components/GenericModal';

const StatusDisabledSection = () => {
	const t = useTranslation();
	const userStatusRoute = useRoute('user-status');
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const handleGoToSettings = useMutableCallback(() => {
		userStatusRoute.push({});
		closeModal();
	});

	return (
		<Box h='x100' bg='hover' color='pure-white' p='x16' display='flex' alignItems='center'>
			<Box>
				<Box fontScale='h5'>{t('User_status_temporarily_disabled')}</Box>
				<Box
					fontScale='p2m'
					is='a'
					color='pure-white'
					onClick={() =>
						setModal(
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
							/>,
						)
					}
				>
					{t('Learn_more')}
				</Box>
			</Box>
			<IconButton tiny icon='cross' />
		</Box>
	);
};

export default StatusDisabledSection;
