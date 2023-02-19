import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useMethod, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import useFeatureBullets from '../hooks/useFeatureBullets';

type ConnectWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const ConnectWorkspaceModal = ({ onClose, onStatusChange, ...props }: ConnectWorkspaceModalProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const bulletFeatures = useFeatureBullets();
	const dispatchToastMessage = useToastMessageDispatch();

	const connectWorkspace = useMethod('cloud:reconnectWorkspace');

	const handleConnectWorkspace = async () => {
		try {
			await connectWorkspace();
			setModal(null);
			dispatchToastMessage({ type: 'success', message: t('Connected') });
		} catch (error: unknown) {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onStatusChange && onStatusChange();
		}
	};

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Workspace_not_connected')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box withRichContent>
					<span>{`${t('RegisterWorkspace_NotConnected_Subtitle')}:`}</span>
					<ul>
						{bulletFeatures.map((features) => (
							<li key={features.key}>
								<strong>{features.title}</strong>
								<Box is='p' mbs={4}>
									{features.description}
								</Box>
							</li>
						))}
					</ul>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button primary onClick={handleConnectWorkspace}>
						{t('ConnectWorkspace_Button')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default ConnectWorkspaceModal;
