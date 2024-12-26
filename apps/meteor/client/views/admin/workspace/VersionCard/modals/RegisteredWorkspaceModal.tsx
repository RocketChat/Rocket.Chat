import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useMethod, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useFeatureBullets from '../hooks/useFeatureBullets';

type RegisteredWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const RegisteredWorkspaceModal = ({ onClose, onStatusChange, ...props }: RegisteredWorkspaceModalProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const bulletFeatures = useFeatureBullets();
	const [isSyncing, setSyncing] = useSafely(useState(false));

	const syncWorkspace = useMethod('cloud:syncWorkspace');

	const handleSyncAction = async () => {
		setSyncing(true);

		try {
			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('RegisterWorkspace_Syncing_Error'));
			}

			dispatchToastMessage({ type: 'success', message: t('RegisterWorkspace_Syncing_Complete') });
			setModal(null);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onStatusChange?.();
			setSyncing(false);
		}
	};

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Workspace_registered')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box withRichContent>
					<span>{`${t('RegisterWorkspace_Registered_Subtitle')}: `}</span>
					<ul>
						{bulletFeatures.map((item, index) => (
							<li key={index}>
								<strong>{item.title}</strong>
								<Box is='p' mbs={4}>
									{item.description}
								</Box>
							</li>
						))}
					</ul>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button icon='reload' onClick={handleSyncAction} loading={isSyncing}>
						{t('Sync')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default RegisteredWorkspaceModal;
