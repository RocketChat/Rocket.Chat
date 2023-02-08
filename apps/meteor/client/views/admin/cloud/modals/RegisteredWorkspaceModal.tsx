import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useMethod, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import useFeatureBullets from '../hooks/useFeatureBullets';
import UnregisterWorkspaceModal from './UnregisterWorkspaceModal';

type RegisteredWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const RegisteredWorkspaceModal = ({ onClose, onStatusChange, ...props }: RegisteredWorkspaceModalProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const bulletFeatures = useFeatureBullets();
	const [isSyncing, setSyncing] = useSafely(useState(false));

	const syncWorkspace = useMethod('cloud:syncWorkspace');

	const handleDeregister = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<UnregisterWorkspaceModal onClose={handleModalClose} onStatusChange={onStatusChange} />);
	};

	const handleSyncAction = async () => {
		setSyncing(true);

		try {
			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}

			dispatchToastMessage({ type: 'success', message: t('Sync Complete') });
			setModal(null);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onStatusChange && onStatusChange());
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
					<Button secondary danger onClick={handleDeregister}>
						{t('Deregister')}
					</Button>
					<Button onClick={handleSyncAction} disabled={isSyncing}>
						<Icon pie={4} name='reload' size='x20' />
						{t('Sync')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default RegisteredWorkspaceModal;
