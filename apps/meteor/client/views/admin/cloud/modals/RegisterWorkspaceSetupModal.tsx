import React, { useState } from 'react';
import { Box, Button, ButtonGroup, CheckBox, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import WorkspaceRegistrationModal from './WorkspaceRegistrationModal';
import { validateEmail } from '../../../../../lib/emailValidator';

type RegisterWorkspaceSetupModalProps = {
  onClose: () => void,
}

const RegisterWorkspaceSetupModal = ({ onClose, ...props }: RegisterWorkspaceSetupModalProps) => {
  const setModal = useSetModal();
  const t = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);

  const validEmail = validateEmail(email);
  const validInfo = validEmail && terms ? true : false;

  const handleNext = (): void => setStep(step + 1);

  const handleBack = (): void => {
    const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
  };

  const handleBackFromConfirmation = (): void => setStep(step - 1);

  return (
    <Modal {...props}>
      <Modal.Header>
				<Modal.HeaderText>
          <Modal.Tagline>{t('RegisterWorkspace_Setup_Steps', { step, numberOfSteps: 2 })}</Modal.Tagline>
					<Modal.Title>{step === 1 ? t('RegisterWorkspace_with_email') : t('Awaiting_confirmation')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
        {
          step === 1 ? (
            <Box>
              <Box is='p' fontSize='p2'>{t('RegisterWorkspace_Setup_Subtitle')}</Box>
              <Field pbs={10}>
                <Field.Label>{t('RegisterWorkspace_Setup_Label')}</Field.Label>
                <Field.Row>
                  <TextInput onChange={e => {
                    setEmail((e.target as HTMLInputElement).value);
                  }} />
                </Field.Row>
              </Field>
              <Box mb={16} fontSize='c1'>
                <Box is='p'><strong>{t('RegisterWorkspace_Setup_Have_Account_Title')}</strong></Box>
                <Box is='p'>{t('RegisterWorkspace_Setup_Have_Account_Subtitle')}</Box>
                <Box is='p' pbs={16}><strong>{t('RegisterWorkspace_Setup_No_Account_Title')}</strong></Box>
                <Box is='p'>{t('RegisterWorkspace_Setup_No_Account_Subtitle')}</Box>
              </Box>
              <Box display='flex' >
                <CheckBox
                  checked={terms}
                  onChange={() => setTerms(!terms)}
                />
                <Box is='p' fontSize='c1' pis={8}>{t('RegisterWorkspace_Setup_Terms_Privacy')}</Box>
              </Box>
            </Box>
          ) : (
            <Box fontSize='p2'>
              <Box is='p'>{t('RegisterWorkspace_Setup_Email_Confirmation', { email })}</Box>
              <Box is='p'>{t('RegisterWorkspace_Setup_Email_Verification')}</Box>
              <Field pbs={10}>
                <Field.Label>{t('Security_code')}</Field.Label>
                <Field.Row>
                  <TextInput defaultValue={'adad'} disabled />
                </Field.Row>
              </Field>
            </Box>
          )}
			</Modal.Content>
      <Modal.Footer>
        {
          step === 1 ? (
              <ButtonGroup align='end'>
                <Button onClick={handleBack}>
                  {t('Back')}
                </Button>
                <Button primary onClick={handleNext} disabled={!validInfo}>
                  {t('Next')}
                </Button>
              </ButtonGroup>
          ) : (
            <Box is='div' display='flex' justifyContent='start' fontSize='c1' w='full'>
              Didn’t receive email? <Box is='a' pi={4}>Resend</Box> or <Box is='a' pi={4} onClick={handleBackFromConfirmation}>change email</Box>
            </Box>
          )
        }
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceSetupModal;
