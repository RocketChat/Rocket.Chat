import React from 'react';
import { Box, Button, ButtonGroup, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import WorkspaceRegistrationModal from './WorkspaceRegistrationModal';

type RegisterWorkspaceTokenModalProps = {
  onClose: () => void,
}

const RegisterWorkspaceTokenModal = ({ onClose, ...props }: RegisterWorkspaceTokenModalProps) => {
  const setModal = useSetModal();

  const handleTokenModal = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
	};

  return (
    <Modal {...props}>
      <Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>Register workspace with token</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
        <Box is='p' fontSize='p2'>1. Go to: <strong>cloud.rocket.chat {`>`} Workspaces</strong> and click <strong>“Register self-managed"</strong>.</Box>
        <Box is='p' fontSize='p2'>2. Copy the token and paste it below</Box>
        <Field pbs={10}>
          <Field.Label>Registration token</Field.Label>
          <Field.Row>
            <TextInput />
          </Field.Row>
        </Field>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleTokenModal}>
            {'Back'}
          </Button>
          <Button primary onClick={() => console.log('submit')}>
            {'Next'}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceTokenModal;
