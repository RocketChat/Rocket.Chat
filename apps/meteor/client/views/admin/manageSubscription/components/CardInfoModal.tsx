import { Modal } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type CardInfoModalProps = {
	title: string;
	text: string;
	close: () => void;
};

const CardInfoModal = ({ title, text, close }: CardInfoModalProps): ReactElement => {
	return (
		<Modal>
			<Modal.Header>
				<Modal.Icon name='info' />
				<Modal.Title>{title}</Modal.Title>
				<Modal.Close onClick={close} />
			</Modal.Header>
			<Modal.Content fontScale='p2' mbe={24}>
				{text}
			</Modal.Content>
		</Modal>
	);
};

export default CardInfoModal;
