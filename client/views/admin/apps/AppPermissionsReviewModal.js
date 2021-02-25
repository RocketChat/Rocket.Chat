import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const AppPermissionsReviewModal = ({
	appPermissions,
	cancel,
	confirm,
	modalProps = {},
}) => {
	const t = useTranslation();

	const handleCloseButtonClick = () => {
		cancel();
	};

	const handleCancelButtonClick = () => {
		cancel();
	};

	const handleConfirmButtonClick = () => {
		confirm(appPermissions);
	};


	return <Modal {...modalProps}>
		<Modal.Header>
			<Icon color='danger' name='info-circled' size={20}/>
			<Modal.Title>{t('Apps_Permissions_Review_Modal_Title')}</Modal.Title>
			<Modal.Close onClick={handleCloseButtonClick}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<ul>
				{
					appPermissions.length
						?	appPermissions.map((permission) =>
							<li key={permission.name}>
								<b>{ t(`Apps_Permissions_${ permission.name.replace('.', '_') }`) }</b>
								{ permission.required && <span style={{ color: 'red' }}> ({ t('required') })</span> }
							</li>)
						: t('Apps_Permissions_No_Permissions_Required')
				}
			</ul>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={handleCancelButtonClick}>{t('Cancel')}</Button>
				<Button primary onClick={handleConfirmButtonClick}>{t('Accept')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default AppPermissionsReviewModal;
