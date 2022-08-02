import { Button, Modal } from '@rocket.chat/fuselage';
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
			<Modal.FooterControllers>
				{cancelText && <Button onClick={onClose}>{cancelText}</Button>}
				{confirmText && onConfirm && (
					<Button primary onClick={onConfirm}>
						{confirmText}
					</Button>
				)}
			</Modal.FooterControllers>
		</Modal.Footer>
	</Modal>
);

export default InfoModal;
