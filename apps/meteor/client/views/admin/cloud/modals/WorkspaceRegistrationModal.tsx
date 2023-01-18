import React from 'react';
import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import RegisterWorkspaceTokenModal from './RegisterWorkspaceTokenModal';
import RegisterWorkspaceSetupModal from './RegisterWorkspaceSetupModal';

type WorkspaceRegistrationModalProps = {
  onClose: () => void,
}

export const bulletItems = [
  {
    title: 'Mobile push notifications',
    description: 'Allows workspace members to receive notifications on their mobile devices.',
  },
  {
    title: 'Marketplace',
    description: 'Install Rocket.Chat Marketplace apps on this workspace.',
  },
  {
    title: 'Omnichannel',
    description: 'Talk to your audience, where they are, through the most popular social channels in the world.',
  },
  {
    title: 'Third-party login',
    description: 'Let workspace members log in using a set of third-party applications.',
  },
];

const WorkspaceRegistrationModal = ({ onClose, ...props }: WorkspaceRegistrationModalProps) => {
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
					<Modal.Title>Workspace not registered</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
				<Box withRichContent>
					<span>Register this workspace and get:</span>
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
        <Box is='div' display='flex' justifyContent='space-between' alignItems='center' w='full'>
          <a href={'https://cloud.rocket.chat'} target='_blank' rel='noopener noreferrer'>
            {'Learn more'}
          </a>
          <ButtonGroup align='end'>
            <Button onClick={handleTokenModal}>
              {'Use token'}
            </Button>
            <Button primary onClick={handleSetupModal}>
              {'Register Workspace'}
            </Button>
          </ButtonGroup>
        </Box>
      </Modal.Footer>
    </Modal>
  )
}

export default WorkspaceRegistrationModal;
