import { FieldGroup, Field, NumberInput, TextInput, Button, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { ActionLink, Form, FormContainer, FormFooter } from '@rocket.chat/layout';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { TotpActionsWrapper } from './TotpForm.styles';

export type TotpFormPayload = {
	totpCode: string;
	backupCode: string;
};

type TotpFormProps = {
	initialValues?: TotpFormPayload;
	onChangeTotpForm: () => void;
	isBackupCode?: boolean;
	formError?: string;
	onSubmit: SubmitHandler<TotpFormPayload>;
};

const TotpForm = ({ onSubmit, initialValues, isBackupCode = false, onChangeTotpForm }: TotpFormProps) => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { errors, isValidating, isSubmitting },
	} = useForm<TotpFormPayload>({
		defaultValues: {
			...initialValues,
		},
	});

	return (
		<Form onSubmit={handleSubmit(onSubmit)}>
			<FormContainer>
				<FieldGroup>
					<Field>
						{isBackupCode ? (
							<FieldLabel>{t('form.totpForm.fields.backupCode.label')}</FieldLabel>
						) : (
							<FieldLabel>{t('form.totpForm.fields.totpCode.label')}</FieldLabel>
						)}
						<FieldRow>
							{isBackupCode ? (
								<TextInput
									{...register('backupCode', {
										required: t('component.form.requiredField'),
									})}
									placeholder={t('form.totpForm.fields.backupCode.placeholder')}
								/>
							) : (
								<NumberInput
									{...register('totpCode', {
										required: t('component.form.requiredField'),
									})}
									placeholder={t('form.totpForm.fields.totpCode.placeholder')}
								/>
							)}
						</FieldRow>
						{errors.backupCode && <FieldError>{errors.backupCode.message}</FieldError>}
						{errors.totpCode && <FieldError>{errors.totpCode.message}</FieldError>}
					</Field>
				</FieldGroup>
			</FormContainer>
			<FormFooter>
				<TotpActionsWrapper>
					<Button type='submit' loading={isValidating || isSubmitting} primary>
						{t('form.totpForm.button.text')}
					</Button>
					<ActionLink fontScale='p2' onClick={onChangeTotpForm}>
						{isBackupCode ? t('form.totpForm.buttonTotpCode.text') : t('form.totpForm.buttonBackupCode.text')}
					</ActionLink>
				</TotpActionsWrapper>
			</FormFooter>
		</Form>
	);
};

export default TotpForm;
