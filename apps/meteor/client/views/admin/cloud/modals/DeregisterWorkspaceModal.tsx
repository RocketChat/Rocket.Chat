import React from 'react';
import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import useFeatureBullets from '../hooks/useFeatureBullets';
import RegisteredWorkspaceModal from './RegisteredWorkspaceModal';

type DeregisterWorkspaceModalProps = {
  onClose: () => void,
}

const DeregisterWorkspaceModal = ({ onClose, ...props }: DeregisterWorkspaceModalProps) => {
  const t = useTranslation();
  const setModal = useSetModal();
  const bulletFeatures = useFeatureBullets();
  
  const handleCancelAction = (): void => {
    const handleModalClose = (): void => setModal(null);
    setModal(<RegisteredWorkspaceModal onClose={handleModalClose} />);
  };

  const handleDeregister = (): void => {
		// here should be the deregister action
	};

  return (
    <Modal {...props}>
      <Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>
            {t('Are_you_sure')}
          </Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
				<Box withRichContent>
					<span>{`${t('RegisterWorkspace_Deregister_Subtitle')}: `}</span>
          <ul>
            {
              bulletFeatures.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong>
                  <Box color='danger' is='p' mbs={4}>{item.deregister}</Box>
                </li>
              ))
            }
          </ul>
				</Box>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleCancelAction}>
            {t('Cancel')} 
          </Button>
          <Button danger onClick={handleDeregister}>
            {t('Deregister_workspace')}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default DeregisterWorkspaceModal;
