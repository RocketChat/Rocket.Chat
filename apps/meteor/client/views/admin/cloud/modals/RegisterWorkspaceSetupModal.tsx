import React, { useState } from 'react';
import { Box, Button, ButtonGroup, CheckBox, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import WorkspaceRegistrationModal from './WorkspaceRegistrationModal';
import { validateEmail } from '../../../../../lib/emailValidator';

type RegisterWorkspaceSetupModalProps = {
  onClose: () => void,
}

const RegisterWorkspaceSetupModal = ({ onClose, ...props }: RegisterWorkspaceSetupModalProps) => {
  const setModal = useSetModal();
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
          <Modal.Tagline>Step {step} of 2</Modal.Tagline>
					<Modal.Title>{step === 1 ? 'Register workspace with email' : 'Awaiting confirmation'}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
      <Modal.Content>
        {
          step === 1 ? (
            <Box>
              <Box is='p' fontSize='p2'>To register this workspace it needs to be associated it with a Rocket.Chat Cloud account.</Box>
              <Field pbs={10}>
                <Field.Label>Cloud account email</Field.Label>
                <Field.Row>
                  <TextInput onChange={e => {
                    setEmail((e.target as HTMLInputElement).value);
                  }} />
                </Field.Row>
              </Field>
              <Box mb={16} fontSize='c1'>
                <Box is='p'><strong>Have an account?.</strong></Box>
                <Box is='p'>Enter your Cloud account email to associate this workspace with your account.</Box>
                <Box is='p' pbs={16}><strong>Don’t have an account?.</strong></Box>
                <Box is='p'>Enter your email to create a new Cloud account and associate this workspace.</Box>
              </Box>
              <Box display='flex' >
                <CheckBox
                  checked={terms}
                  onChange={() => setTerms(!terms)}
                />
                <Box is='p' fontSize='c1' pis={8}>
                  I agree with <a href='https://rocket.chat/terms'>Terms and Conditions</a> and <a href='https://rocket.chat/privacy'>Privacy Policy</a>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box fontSize='p2'>
              <Box is='p'>Email sent to <strong>{email}</strong> with a confirmation link.</Box>
              <Box is='p'>Please verify that the security code below matches the one in the email.</Box>
              <Field pbs={10}>
                <Field.Label>Security code</Field.Label>
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
                  {'Back'}
                </Button>
                <Button primary onClick={handleNext} disabled={!validInfo}>
                  {'Next'}
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
