import {
	Button,
	ButtonGroup,
	CheckBox,
	Field,
	FieldLabel,
	FieldRow,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalHeaderText,
	ModalTagline,
	ModalTitle,
	Stack,
	Text,
	TextInput,
} from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { links } from '../../../../../../lib/links';
import WorkspaceRegistrationModal from '../RegisterWorkspaceModal';
import RegistrationAccountNote from '../layout/RegistrationAccountNote';

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
			<ModalHeader>
				<ModalHeaderText>
					<ModalTagline>{t('RegisterWorkspace_Setup_Steps', { step, numberOfSteps: 2 })}</ModalTagline>
					<ModalTitle>{t('RegisterWorkspace_with_email')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Stack gap='x16'>
					<Stack gap='x8'>
						<Text is='p'>{t('RegisterWorkspace_Setup_Subtitle')}</Text>
						<Field>
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
					</Stack>
					<RegistrationAccountNote title={t('RegisterWorkspace_Setup_Have_Account_Title')}>
						{t('RegisterWorkspace_Setup_Have_Account_Subtitle')}
					</RegistrationAccountNote>
					<RegistrationAccountNote title={t('RegisterWorkspace_Setup_No_Account_Title')}>
						{t('RegisterWorkspace_Setup_No_Account_Subtitle')}
					</RegistrationAccountNote>
					<Field>
						<FieldRow>
							<Stack direction='row' align='center'>
								<FieldLabel htmlFor={termsField}>
									<Text is='span' fontScale='c1'>
										<Trans i18nKey='RegisterWorkspace_Setup_Terms_Privacy'>
											I agree with <ExternalLink to={links.terms}>Terms and Conditions</ExternalLink> and{' '}
											<ExternalLink to={links.privacy}>Privacy Policy</ExternalLink>
										</Trans>
									</Text>
								</FieldLabel>
								<CheckBox id={termsField} checked={terms} onChange={() => setTerms(!terms)} />
							</Stack>
						</FieldRow>
					</Field>
				</Stack>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup align='end'>
					<Button onClick={handleBack}>{t('Back')}</Button>
					<Button variant='primary' onClick={handleRegisterWorkspace} disabled={!validInfo}>
						{t('Next')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default RegisterWorkspaceSetupStepOneModal;
