import React from 'react';
import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import RegisterWorkspaceTokenModal from './RegisterWorkspaceTokenModal';
import RegisterWorkspaceSetupModal from './RegisterWorkspaceSetupModal';
import useFeatureBullets from '../hooks/useFeatureBullets';

type RegisteredWorkspaceModalProps = {
  onClose: () => void,
}

const RegisteredWorkspaceModal = ({ onClose, ...props }: RegisteredWorkspaceModalProps) => {
  const setModal = useSetModal();
  const bulletFeatures = useFeatureBullets();
  const t = useTranslation();

  const handleTokenModal = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceTokenModal onClose={handleModalClose} />);
	};

  const handleSetupModal = (): void => {
    const handleModalClose = (): void => setModal(null);
    setModal(<RegisterWorkspaceSetupModal onClose={handleModalClose} />);
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
					<span>`${t('RegisterWorkspace_Registered_Subtitle')}: `</span>
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
          <Box is='p' fontSize='p2'>{t('RegisterWorkspace_Registered_Benefits')}}</Box>
				</Box>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleTokenModal}>
            {t('Deregister')}
          </Button>
          <Button primary onClick={handleSetupModal}>
            {t('Sync')}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisteredWorkspaceModal;
