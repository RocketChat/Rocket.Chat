import { Modal, Box, Field, FieldLabel, FieldRow, TextInput, CheckBox, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import WorkspaceRegistrationModal from '../RegisterWorkspaceModal';

type Props = {
	email: string;
	setEmail: (email: string) => void;
	step: number;
	setStep: (step: number) => void;
	terms: boolean;
	setTerms: (terms: boolean) => void;
	onClose: () => void;
	validInfo: boolean;
	setIntentData: (intentData: any) => void;
};

const RegisterWorkspaceSetupStepOneModal = ({
	email,
	setEmail,
	step,
	setStep,
	terms,
	setTerms,
	onClose,
	validInfo,
	setIntentData,
	...props
}: Props) => {
	const setModal = useSetModal();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const createRegistrationIntent = useEndpoint('POST', '/v1/cloud.createRegistrationIntent');

	const handleBack = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	const handleRegisterWorkspace = async () => {
		try {
			const { intentData } = await createRegistrationIntent({ resend: false, email });
			setIntentData(intentData);
			setStep(step + 1);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const emailField = useId();
	const termsField = useId();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline>{t('RegisterWorkspace_Setup_Steps', { step, numberOfSteps: 2 })}</Modal.Tagline>
					<Modal.Title>{t('RegisterWorkspace_with_email')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box>
					<Box is='p' fontSize='p2' withRichContent>
						{t('RegisterWorkspace_Setup_Subtitle')}
					</Box>
					<Field pbs={10}>
						<FieldLabel htmlFor={emailField}>{t('RegisterWorkspace_Setup_Label')}</FieldLabel>
						<FieldRow>
							<TextInput
								id={emailField}
								onChange={(e) => {
									setEmail((e.target as HTMLInputElement).value);
								}}
							/>
						</FieldRow>
					</Field>
					<Box mb={16} fontSize='c1'>
						<Box is='p'>
							<strong>{t('RegisterWorkspace_Setup_Have_Account_Title')}</strong>
						</Box>
						<Box is='p'>{t('RegisterWorkspace_Setup_Have_Account_Subtitle')}</Box>
						<Box is='p' pbs={16}>
							<strong>{t('RegisterWorkspace_Setup_No_Account_Title')}</strong>
						</Box>
						<Box is='p'>{t('RegisterWorkspace_Setup_No_Account_Subtitle')}</Box>
					</Box>
					<Field>
						<FieldRow justifyContent='initial'>
							<FieldLabel display='block' fontScale='c1' htmlFor={termsField}>
								<Trans i18nKey='RegisterWorkspace_Setup_Terms_Privacy'>
									I agree with <ExternalLink to='https://rocket.chat/terms'>Terms and Conditions</ExternalLink> and{' '}
									<ExternalLink to='https://rocket.chat/privacy'>Privacy Policy</ExternalLink>
								</Trans>
							</FieldLabel>
							<CheckBox id={termsField} checked={terms} onChange={() => setTerms(!terms)} />
						</FieldRow>
					</Field>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={handleBack}>{t('Back')}</Button>
					<Button primary onClick={handleRegisterWorkspace} disabled={!validInfo}>
						{t('Next')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default RegisterWorkspaceSetupStepOneModal;
