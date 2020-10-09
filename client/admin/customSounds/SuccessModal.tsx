import React, { FC } from 'react';
import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

type SuccessModalProps = {
	onClose: () => void;
};

const SuccessModal: FC<SuccessModalProps> = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Custom_Sound_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default SuccessModal;
