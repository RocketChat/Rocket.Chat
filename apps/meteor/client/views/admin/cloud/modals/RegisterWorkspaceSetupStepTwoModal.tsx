import React, { useCallback, useEffect } from 'react'
import { Modal, Box, Field, TextInput } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';

type Props = {
  email: string,
  step: number,
  setStep: (step: number) => void,
  onClose: () => void,
  intentData: {
    device_code: string,
    interval: number,
    user_code: string,
  },
  onSuccess: () => void,
}

const RegisterWorkspaceSetupStepTwoModal = ({ email, step, setStep, onClose, intentData, onSuccess, ...props }: Props) => {
  const t = useTranslation();
  const dispatchToastMessage = useToastMessageDispatch();

  const cloudConfirmationPoll = useEndpoint('GET', '/v1/cloud.confirmationPoll');
  const createRegistrationIntent = useEndpoint('POST', '/v1/cloud.createRegistrationIntent');

  const handleBackFromConfirmation = (): void => setStep(step - 1);

  const handleResendRegistrationEmail = async () => {
    try {
      await createRegistrationIntent({ resend: true, email });
    } catch (error: unknown) {
      dispatchToastMessage({ type: 'error', message: error });
    }
  };

  const getConfirmation = useCallback(async () => {
		try {
			const { pollData } = await cloudConfirmationPoll({
				deviceCode: intentData.device_code,
			});

      if ('successful' in pollData && pollData.successful) {
				dispatchToastMessage({ type: 'success', message: t('Workspace_registered') });
        onSuccess();
			}
		} catch (error: any) {
			console.log(error)
		}
	}, [cloudConfirmationPoll, intentData.device_code, dispatchToastMessage, t]);

	useEffect(() => {
		const pollInterval = setInterval(() => getConfirmation(), intentData.interval);

		return (): void => clearInterval(pollInterval);
	}, [getConfirmation, intentData]);

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
              <TextInput defaultValue={intentData.user_code} disabled />
            </Field.Row>
          </Field>
        </Box>
      </Modal.Content>
      <Modal.Footer>
        <Box is='div' display='flex' justifyContent='start' fontSize='c1' w='full'>
          Didn’t receive email? <Box is='a' pi={4} onClick={handleResendRegistrationEmail}>Resend</Box> or <Box is='a' pi={4} onClick={handleBackFromConfirmation}>change email</Box>
        </Box>
      </Modal.Footer>
    </Modal>
  )
}

export default RegisterWorkspaceSetupStepTwoModal