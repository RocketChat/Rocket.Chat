import React from 'react';
import { Box, Button, ButtonGroup, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import WorkspaceRegistrationModal from './WorkspaceRegistrationModal';

type RegisterWorkspaceTokenModalProps = {
  onClose: () => void,
}

const RegisterWorkspaceTokenModal = ({ onClose, ...props }: RegisterWorkspaceTokenModalProps) => {
  const setModal = useSetModal();
  const t = useTranslation();

  const handleBackAction = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
	};

  const handleToken = (): void => {
    // here should be the connection to the service
  }

  return (
    <Modal {...props}>
      <Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('RegisterWorkspace_Token_Title')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
        <Box is='p' fontSize='p2'>{`1. ${t('RegisterWorkspace_Token_Step_One')}`}</Box>
        <Box is='p' fontSize='p2'>{`2. ${t('RegisterWorkspace_Token_Step_Two')}`}</Box>
        <Field pbs={10}>
          <Field.Label>{t('Registration_Token')}</Field.Label>
          <Field.Row>
            <TextInput />
          </Field.Row>
        </Field>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleBackAction}>
            {t('Back')}
          </Button>
          <Button primary onClick={handleToken}>
            {t('Next')}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceTokenModal;
