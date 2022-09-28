import { Box, Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import HumanizedPermissionsList from './components/HumanizedPermissionsList';

type AppPermissionsReviewModalProps = {
	appPermissions: Array<{ name: string; required?: boolean }>;
	cancel: () => void;
	confirm: (permissionsGranted: any) => void;
};

const AppPermissionsReviewModal = ({ appPermissions, cancel, confirm, ...props }: AppPermissionsReviewModalProps): ReactElement => {
	const t = useTranslation();

	const handleCloseButtonClick = (): void => {
		cancel();
	};

	const handleCancelButtonClick = (): void => {
		cancel();
	};

	const handleConfirmButtonClick = (): void => {
		confirm(appPermissions);
	};

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Icon color='warning' name='modal-warning' />
				<Modal.Title>{t('Apps_Permissions_Review_Modal_Title')}</Modal.Title>
				<Modal.Close onClick={handleCloseButtonClick} />
			</Modal.Header>
			<Modal.Content marginBlockEnd={20} fontScale='p2'>
				{t('Apps_Permissions_Review_Modal_Subtitle')}
			</Modal.Content>
			<Modal.Content fontScale='p2'>
				<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis='x24'>
					<HumanizedPermissionsList appPermissions={appPermissions} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={handleCancelButtonClick}>
						{t('Cancel')}
					</Button>
					<Button primary onClick={handleConfirmButtonClick}>
						{t('Agree')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AppPermissionsReviewModal;
