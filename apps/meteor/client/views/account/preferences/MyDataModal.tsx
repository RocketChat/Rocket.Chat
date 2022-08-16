import { Button, Box, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, ReactNode } from 'react';

type MyDataModalProps = {
	onCancel: () => void;
	title: string;
	text?: ReactNode;
};

const MyDataModal: FC<MyDataModalProps> = ({ onCancel, title, text, ...props }) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Icon color='success' name='circle-check' />
				<Modal.Title>{title}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			{text && (
				<Modal.Content fontScale='p2'>
					<Box mb='x8'>{text}</Box>
				</Modal.Content>
			)}
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button primary onClick={onCancel}>
						{t('Ok')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default MyDataModal;
