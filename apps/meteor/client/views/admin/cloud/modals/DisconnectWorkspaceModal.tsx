import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useMethod, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import useFeatureBullets from '../hooks/useFeatureBullets';
import RegisteredWorkspaceModal from './RegisteredWorkspaceModal';

type DisconnectWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const DisconnectWorkspaceModal = ({ onClose, onStatusChange, ...props }: DisconnectWorkspaceModalProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const bulletFeatures = useFeatureBullets();
	const dispatchToastMessage = useToastMessageDispatch();

	const disconnectWorkspace = useMethod('cloud:disconnectWorkspace');

	const handleCancelAction = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisteredWorkspaceModal onClose={handleModalClose} />);
	};

	const handleUnregister = async () => {
		try {
			const success = await disconnectWorkspace();

			if (!success) {
				throw Error(t('RegisterWorkspace_Disconnect_Error'));
			}

			dispatchToastMessage({ type: 'success', message: t('Disconnected') });

			setModal(null);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onStatusChange && onStatusChange());
		}
	};

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Are_you_sure')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box withRichContent>
					<span>{`${t('RegisterWorkspace_Disconnect_Subtitle')}: `}</span>
					<ul>
						{bulletFeatures.map((item, index) => (
							<li key={index}>
								<strong>{item.title}</strong>
								<Box color='danger' is='p' mbs={4}>
									{item.disconnect}
								</Box>
							</li>
						))}
					</ul>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={handleCancelAction}>{t('Cancel')}</Button>
					<Button danger onClick={handleUnregister}>
						{t('Disconnect_workspace')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default DisconnectWorkspaceModal;
