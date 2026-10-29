import {
	Button,
	ButtonGroup,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useFeatureBullets from '../hooks/useFeatureBullets';
import FeatureBullet from './layout/FeatureBullet';
import RegistrationProse from './layout/RegistrationProse';

export type RegisteredWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const RegisteredWorkspaceModal = ({ onClose, onStatusChange, ...props }: RegisteredWorkspaceModalProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const bulletFeatures = useFeatureBullets();
	const [isSyncing, setSyncing] = useSafely(useState(false));

	const syncWorkspace = useEndpoint('POST', '/v1/cloud.syncWorkspace');

	const handleSyncAction = async () => {
		setSyncing(true);

		try {
			const { success } = await syncWorkspace();

			if (!success) {
				throw Error(t('RegisterWorkspace_Syncing_Error'));
			}

			dispatchToastMessage({ type: 'success', message: t('RegisterWorkspace_Syncing_Complete') });
			setModal(null);
		} catch (error) {
			const message = error instanceof Error ? error.message : t('RegisterWorkspace_Syncing_Error');
			dispatchToastMessage({ type: 'error', message });
		} finally {
			onStatusChange?.();
			setSyncing(false);
		}
	};

	return (
		<Modal {...props}>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Workspace_registered')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<RegistrationProse>
					{`${t('RegisterWorkspace_Registered_Subtitle')}: `}
					<ul>
						{bulletFeatures.map((item, index) => (
							<FeatureBullet key={index} title={item.title}>
								{item.description}
							</FeatureBullet>
						))}
					</ul>
				</RegistrationProse>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup align='end'>
					<Button icon='reload' onClick={handleSyncAction} loading={isSyncing}>
						{t('Sync')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default RegisteredWorkspaceModal;
