import React from 'react'
import { Modal, Box, Field, TextInput, CheckBox, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import WorkspaceRegistrationModal from './WorkspaceRegistrationModal';

type Props = {
  email: string,
  setEmail: (email: string) => void,
  step: number,
  setStep: (step: number) => void,
  terms: boolean,
  setTerms: (terms: boolean) => void,
  onClose: () => void,
  validInfo: boolean,
}

const RegisterWorkspaceSetupStepOneModal = ({ 
  email, 
  setEmail, 
  step, 
  setStep,
  terms, 
  setTerms, 
  onClose,
  validInfo,
  ...props
}: Props) => {
  const setModal = useSetModal();
  const t = useTranslation();

  const handleBack = (): void => {
    const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
  };

  const handleNext = (): void => setStep(step + 1);

  return (
    <Modal { ...props }>
      <Modal.Header>
        <Modal.HeaderText>
          <Modal.Tagline>{t('RegisterWorkspace_Setup_Steps', { step, numberOfSteps: 2 })}</Modal.Tagline>
          <Modal.Title>{t('RegisterWorkspace_with_email')}</Modal.Title>
        </Modal.HeaderText>
        <Modal.Close onClick={onClose} />
      </Modal.Header>
      <Modal.Content>
        <Box>
          <Box is='p' fontSize='p2'>{t('RegisterWorkspace_Setup_Subtitle')}</Box>
          <Field pbs={10}>
            <Field.Label>{t('RegisterWorkspace_Setup_Label')}</Field.Label>
            <Field.Row>
              <TextInput onChange={e => {
                setEmail((e.target as HTMLInputElement).value);
              } } />
            </Field.Row>
          </Field>
          <Box mb={16} fontSize='c1'>
            <Box is='p'><strong>{t('RegisterWorkspace_Setup_Have_Account_Title')}</strong></Box>
            <Box is='p'>{t('RegisterWorkspace_Setup_Have_Account_Subtitle')}</Box>
            <Box is='p' pbs={16}><strong>{t('RegisterWorkspace_Setup_No_Account_Title')}</strong></Box>
            <Box is='p'>{t('RegisterWorkspace_Setup_No_Account_Subtitle')}</Box>
          </Box>
          <Box display='flex'>
            <CheckBox
              checked={terms}
              onChange={() => setTerms(!terms)} />
            <Box is='p' fontSize='c1' pis={8}>{t('RegisterWorkspace_Setup_Terms_Privacy')}</Box>
          </Box>
        </Box>
      </Modal.Content>
      <Modal.Footer>
        <ButtonGroup align='end'>
          <Button onClick={handleBack}>
            {t('Back')}
          </Button>
          <Button primary onClick={handleNext} disabled={!validInfo}>
            {t('Next')}
          </Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceSetupStepOneModal