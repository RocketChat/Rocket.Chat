import { Box, Label } from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter, FormHeader, FormSteps, FormTitle } from '@rocket.chat/layout';
import { Trans, useTranslation } from 'react-i18next';

import EmailCodeFallback from '../../common/EmailCodeFallback';

type AwaitingConfirmationFormProps = {
	currentStep: number;
	stepCount: number;
	securityCode: string;
	emailAddress: string;
	onResendEmailRequest: () => void;
	onChangeEmailRequest: () => void;
};

const AwaitingConfirmationForm = ({
	currentStep,
	stepCount,
	securityCode,
	emailAddress,
	onResendEmailRequest,
	onChangeEmailRequest,
}: AwaitingConfirmationFormProps) => {
	const { t } = useTranslation();

	return (
		<Form>
			<FormHeader>
				<FormSteps currentStep={currentStep} stepCount={stepCount} />
				<FormTitle>{t('form.awaitConfirmationForm.title')}</FormTitle>
			</FormHeader>
			<FormContainer>
				<Box fontScale='p2' marginBlockEnd={24}>
					<Trans i18nKey='form.awaitConfirmationForm.content.sentEmail' values={{ emailAddress }}>
						Email sent to <strong>{emailAddress}</strong> with a confirmation link.Please verify that the security code below matches the
						one in the email.
					</Trans>
				</Box>
				<Label display='block'>
					<>{t('form.awaitConfirmationForm.content.securityCode')}</>
					<Box padding='12px' width='full' fontScale='p2b' lineHeight='20px' backgroundColor='tint' elevation='1'>
						{securityCode}
					</Box>
				</Label>
			</FormContainer>
			<FormFooter>
				<EmailCodeFallback onResendEmailRequest={onResendEmailRequest} onChangeEmailRequest={onChangeEmailRequest} />
			</FormFooter>
		</Form>
	);
};

export default AwaitingConfirmationForm;
