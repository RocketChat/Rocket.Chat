import React, { useState, ChangeEvent } from 'react';
import { Box, Button, ButtonGroup, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useMethod, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import WorkspaceRegistrationModal from './WorkspaceRegistrationModal';

type RegisterWorkspaceTokenModalProps = {
  onClose: () => void,
  onStatusChange?: () => void,
  isConnectedToCloud: boolean
}

const RegisterWorkspaceTokenModal = ({ onClose, onStatusChange, isConnectedToCloud, ...props }: RegisterWorkspaceTokenModalProps) => {
  const setModal = useSetModal();
  const t = useTranslation();
  const dispatchToastMessage = useToastMessageDispatch();
  const connectWorkspace = useMethod('cloud:connectWorkspace');
  const syncWorkspace = useMethod('cloud:syncWorkspace');
  
  const [token, setToken] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleBackAction = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} isConnectedToCloud={isConnectedToCloud} />);
	};

  const handleTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
		setToken(event.target.value);
	};

  const handleConnectButtonClick = async () => {
		setProcessing(true);

		try {
			const isConnected = await connectWorkspace(token);

			if (!isConnected) {
				throw Error(t('An error occured connecting'));
			}

			dispatchToastMessage({ type: 'success', message: t('Connected') });

			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onStatusChange && onStatusChange());
			setProcessing(false);
		}
	};

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
            <TextInput onChange={handleTokenChange} value={token} />
          </Field.Row>
        </Field>
			</Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleBackAction}>
            {t('Back')}
          </Button>
          <Button primary disabled={processing} onClick={handleConnectButtonClick}>
            {t('Next')}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceTokenModal;
