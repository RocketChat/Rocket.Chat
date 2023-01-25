import React from 'react'
import { Modal, Box, Field, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';

type Props = {
  email: string,
  step: number,
  setStep: (step: number) => void,
  onClose: () => void,
}

const RegisterWorkspaceSetupStepTwoModal = ({ email, step, setStep, onClose, ...props }: Props) => {
  const t = useTranslation();

  const handleBackFromConfirmation = (): void => setStep(step - 1);

  return (
    <Modal { ...props }>
      <Modal.Header>
        <Modal.HeaderText>
          <Modal.Tagline>{t('RegisterWorkspace_Setup_Steps', { step, numberOfSteps: 2 })}</Modal.Tagline>
          <Modal.Title>{t('Awaiting_confirmation')}</Modal.Title>
        </Modal.HeaderText>
        <Modal.Close onClick={onClose} />
      </Modal.Header>
      <Modal.Content>
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
      </Modal.Content>
      <Modal.Footer>
        <Box is='div' display='flex' justifyContent='start' fontSize='c1' w='full'>
          Didn’t receive email? <Box is='a' pi={4}>Resend</Box> or <Box is='a' pi={4} onClick={handleBackFromConfirmation}>change email</Box>
        </Box>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceSetupStepTwoModal