import { Button, ButtonGroup, Box, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../components/MarkdownText';

type AnnouncementModalParams = {
	onClose: () => void;
	confirmLabel?: string;
	children?: string;
};

const AnnouncementModal: FC<AnnouncementModalParams> = ({ onClose, confirmLabel = 'Close', children, ...props }) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Title>{t('Announcement')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box>
					<MarkdownText content={children} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{confirmLabel}</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default AnnouncementModal;
