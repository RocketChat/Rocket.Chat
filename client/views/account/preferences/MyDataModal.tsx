import React, { FC } from 'react';
import { ButtonGroup, Button, Icon, Box, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';

type MyDataModalProps = {
	onCancel: () => void;
	title: string;
	text: string;
};

const MyDataModal: FC<MyDataModalProps> = ({ onCancel, title, text, ...props }) => {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='circle-check' size={20}/>
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Box mb='x8'>{text}</Box>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onCancel}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default MyDataModal;
