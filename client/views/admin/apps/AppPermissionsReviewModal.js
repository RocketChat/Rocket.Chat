import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetModal } from '../../../contexts/ModalContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const AppPermissionsReviewModal = (props) => {
	const {
		appPermissions,
		cancel,
		confirm
	} = props;

	const t = useTranslation();
	const setModal = useSetModal();

	const handleCloseButtonClick = () => {
		cancel();
	};

	const handleCancelButtonClick = () => {
		cancel();
	};

	const handleConfirmButtonClick = () => {
		confirm(appPermissions);
	};


	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='info-circled' size={20}/>
			<Modal.Title>{t('Apps_Permissions_Review_Modal_Title')}</Modal.Title>
			<Modal.Close onClick={handleCloseButtonClick}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<ul>
				{
					props.appPermissions.map((permission) =>
						<li key={permission.name}>
							<b>{ t('Apps_Permissions_' + permission.name.replace('.','_')) }</b>
							{ permission.required && <span style={{ color: 'red' }}> ({ t('Required') })</span> }
						</li>
					)
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
