import React from 'react';
import { Button, ButtonGroup, Box, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import MarkdownText from '../../../components/MarkdownText';

export default ({
	onClose,
	confirmLabel = 'Close',
	children,
	...props
}) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Title>{t('Announcement')}</Modal.Title>
				<Modal.Close onClick={onClose}/>
			</Modal.Header>
			<Modal.Content>
				<Box textAlign='center'><MarkdownText content={children} /></Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{confirmLabel}</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};
