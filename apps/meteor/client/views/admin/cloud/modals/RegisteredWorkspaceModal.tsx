import React from 'react';
import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import useFeatureBullets from '../hooks/useFeatureBullets';
import DeregisterWorkspaceModal from './DeregisterWorkspaceModal';

type RegisteredWorkspaceModalProps = {
  onClose: () => void,
}

const RegisteredWorkspaceModal = ({ onClose, ...props }: RegisteredWorkspaceModalProps) => {
  const t = useTranslation();
  const setModal = useSetModal();
  const bulletFeatures = useFeatureBullets();

  const handleDeregister = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<DeregisterWorkspaceModal onClose={handleModalClose} />);
	};

  const handleSyncAction = (): void => {
    // here should be the sync action
  };

  return (
    <Modal {...props}>
      <Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('RegisterWorkspace_Registered_Title')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
				<Box withRichContent>
					<span>{`${t('RegisterWorkspace_Registered_Subtitle')}: `}</span>
          <ul>
            {
              bulletFeatures.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong>
                  <Box is='p' mbs={4}>{item.description}</Box>
                </li>
              ))
            }
          </ul>
				</Box>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button secondary danger onClick={handleDeregister}>
            {t('Deregister')}
          </Button>
          <Button onClick={handleSyncAction}>
            <Icon pie={4} name='reload' size='x20' />
            {t('Sync')}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisteredWorkspaceModal;
