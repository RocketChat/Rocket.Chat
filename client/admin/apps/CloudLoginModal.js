import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';

export const CloudLoginModal = ({ cancel, ...props }) => {
	const t = useTranslation();
	const router = useRoute('cloud');

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='info-circled' size={20}/>
			<Modal.Title>{t('Apps_Marketplace_Login_Required_Title')}</Modal.Title>
			<Modal.Close onClick={cancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Apps_Marketplace_Login_Required_Description')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={cancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={() => router.push({})}>{t('Login')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};
