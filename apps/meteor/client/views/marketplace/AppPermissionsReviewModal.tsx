import { Button, Modal } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

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
				<ul>
					{appPermissions.length
						? appPermissions.map((permission, count) => (
								<li key={permission.name}>
									<b>{count + 1} - </b>
									{t(`Apps_Permissions_${permission.name.replace('.', '_')}` as TranslationKey)}
									{permission.required && <span style={{ color: 'red' }}> ({t('required')})</span>}
								</li>
						  ))
						: t('Apps_Permissions_No_Permissions_Required')}
				</ul>
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
