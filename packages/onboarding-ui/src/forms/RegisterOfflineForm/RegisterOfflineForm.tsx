import { Form, FormHeader, FormTitle } from '@rocket.chat/layout';
import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import CopyStep from './steps/CopyStep';
import PasteStep from './steps/PasteStep';

export type RegisterOfflinePayload = {
	token: string;
	agreement: boolean;
};

type RegisterOfflineFormProps = {
	termsHref: string;
	policyHref: string;
	clientKey: string;
	onSubmit: SubmitHandler<RegisterOfflinePayload>;
	onCopySecurityCode: () => void;
	onBackButtonClick: () => void;
};

export const Steps = {
	COPY: 'copy',
	PASTE: 'paste',
};

const RegisterOfflineForm = ({
	termsHref,
	policyHref,
	clientKey,
	onSubmit,
	onCopySecurityCode,
	onBackButtonClick,
}: RegisterOfflineFormProps) => {
	const { t } = useTranslation();

	const [step, setStep] = useState(Steps.COPY);

	const form = useForm<RegisterOfflinePayload>({
		mode: 'onChange',
		defaultValues: {
			token: '',
			agreement: false,
		},
	});

	const { handleSubmit } = form;

	return (
		<FormProvider {...form}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<FormHeader>
					<FormTitle>{t('form.registerOfflineForm.title')}</FormTitle>
				</FormHeader>
				{step === Steps.COPY ? (
					<CopyStep
						termsHref={termsHref}
						policyHref={policyHref}
						clientKey={clientKey}
						setStep={setStep}
						onCopySecurityCode={onCopySecurityCode}
						onBackButtonClick={onBackButtonClick}
					/>
				) : (
					<PasteStep setStep={setStep} />
				)}
			</Form>
		</FormProvider>
	);
};

export default RegisterOfflineForm;
