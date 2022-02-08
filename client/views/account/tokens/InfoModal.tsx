import { Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

type InfoModalProps = {
	title: string;
	content: ReactNode;
	icon: ReactNode;
	confirmText: string;
	cancelText: string;
	onConfirm: () => void;
	onClose: () => void;
};

const InfoModal: FC<InfoModalProps> = ({ title, content, icon, confirmText, cancelText, onConfirm, onClose, ...props }) => (
	<Modal {...props}>
		<Modal.Header>
			{icon}
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onClose} />
		</Modal.Header>
		<Modal.Content fontScale='p2'>{content}</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				{cancelText && <Button onClick={onClose}>{cancelText}</Button>}
				{confirmText && onConfirm && (
					<Button primary onClick={onConfirm}>
						{confirmText}
					</Button>
				)}
			</ButtonGroup>
		</Modal.Footer>
	</Modal>
);

export default InfoModal;
