import React from 'react';
import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import RegisterWorkspaceTokenModal from './RegisterWorkspaceTokenModal';
import RegisterWorkspaceSetupModal from './RegisterWorkspaceSetupModal';
import { bulletItems } from './WorkspaceRegistrationModal';

type RegisteredWorkspaceModalProps = {
  onClose: () => void,
}

const RegisteredWorkspaceModal = ({ onClose, ...props }: RegisteredWorkspaceModalProps) => {
  const setModal = useSetModal();

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
					<Modal.Title>Workspace registered</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
				<Box withRichContent>
					<span>Because this workspace is registered the following is available:</span>
          <ul>
            {
              bulletItems.map((item, index) => (
                <li key={index}>
                  <strong>{item.title}</strong>
                  <Box is='p' mbs={4}>{item.description}</Box>
                </li>
              ))
            }
          </ul>
          <Box is='p' fontSize='p2'>Registration allows automatic license updates, notifications of critical vulnerabilities and access to Rocket.Chat Cloud services. No sensitive workspace data is shared with Rocket.Chat.</Box>
				</Box>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleTokenModal}>
            {'Deregister'}
          </Button>
          <Button primary onClick={handleSetupModal}>
            {'Sync'}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisteredWorkspaceModal;
