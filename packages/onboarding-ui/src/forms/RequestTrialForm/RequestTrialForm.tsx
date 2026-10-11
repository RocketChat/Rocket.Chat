import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldRow,
	Button,
	Field,
	Box,
	CheckBox,
	FieldGroup,
	TextInput,
	EmailInput,
	Select,
	SelectFiltered,
} from '@rocket.chat/fuselage';
import { Form, FormFooter } from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';

export type RequestTrialPayload = {
	email: string;
	organizationName: string;
	organizationSize: string;
	country: string;
	updates: boolean;
	agreement: boolean;
};

export type RequestTrialFormProps = {
	defaultValues?: RequestTrialPayload;
	organizationSizeOptions: SelectOption[];
	countryOptions: SelectOption[];
	onSubmit: SubmitHandler<RequestTrialPayload>;
	onManageWorkspaceClick: () => void;
	validateEmail: Validate<FieldPathValue<RequestTrialPayload, 'email'>, RequestTrialPayload>;
	termsHref?: string;
	policyHref?: string;
};

export const RequestTrialForm = ({
	defaultValues,
	organizationSizeOptions,
	countryOptions,
	onSubmit,
	validateEmail,
	termsHref = 'https://rocket.chat/terms',
	policyHref = 'https://rocket.chat/privacy',
}: RequestTrialFormProps) => {
	const { t } = useTranslation();

	const {
		handleSubmit,
		register,
		control,
		formState: { isValidating, isSubmitting, isValid, errors },
	} = useForm<RequestTrialPayload>({ mode: 'onChange' });

	return (
		<Form onSubmit={handleSubmit(onSubmit)}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('form.requestTrialForm.fields.emailAddress.label')}</FieldLabel>
					<FieldRow>
						<EmailInput
							{...register('email', {
								validate: validateEmail,
								required: true,
							})}
							placeholder={t('form.requestTrialForm.fields.emailAddress.placeholder')}
							defaultValue={defaultValues?.email}
							error={errors?.email?.message || undefined}
						/>
					</FieldRow>
					{errors?.email && <FieldError>{errors.email.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('form.requestTrialForm.fields.organizationName.label')}</FieldLabel>
					<FieldRow>
						<TextInput
							{...register('organizationName', { required: true })}
							placeholder={t('form.requestTrialForm.fields.organizationName.placeholder')}
							defaultValue={defaultValues?.organizationName}
						/>
					</FieldRow>
					{errors?.organizationName && <FieldError>{t('component.form.requiredField')}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('form.requestTrialForm.fields.organizationSize.label')}</FieldLabel>
					<FieldRow>
						<Controller
							name='organizationSize'
							control={control}
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									{...field}
									options={organizationSizeOptions}
									placeholder={t('form.requestTrialForm.fields.organizationSize.placeholder')}
									error={errors?.email?.message || undefined}
								/>
							)}
							defaultValue={defaultValues?.organizationSize}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('form.requestTrialForm.fields.country.label')}</FieldLabel>
					<FieldRow>
						<Controller
							name='country'
							control={control}
							rules={{ required: true }}
							render={({ field }) => (
								<SelectFiltered
									{...field}
									options={countryOptions}
									width='full'
									placeholder={t('form.requestTrialForm.fields.country.placeholder')}
								/>
							)}
							defaultValue={defaultValues?.country}
						/>
					</FieldRow>
				</Field>
				<Field>
					<Box marginBlockStart={24}>
						<Box marginBlockEnd={8} display='flex' flexDirection='row' alignItems='flex-start' fontScale='c1' lineHeight={20}>
							<CheckBox marginInlineEnd={8} {...register('updates')} />{' '}
							<Box is='label' htmlFor='updates'>
								{t('form.registeredServerForm.keepInformed')}
							</Box>
						</Box>
						<Box display='flex' flexDirection='row' alignItems='flex-start' color='default' fontScale='c1' lineHeight={20}>
							<CheckBox marginInlineEnd={8} {...register('agreement', { required: true })} />{' '}
							<Box is='label' htmlFor='agreement' withRichContent>
								<Trans i18nKey='component.form.termsAndConditions'>
									I agree with
									<a href={termsHref} target='_blank' rel='noopener noreferrer'>
										Terms and Conditions
									</a>
									and
									<a href={policyHref} target='_blank' rel='noopener noreferrer'>
										Privacy Policy
									</a>
								</Trans>
							</Box>
						</Box>
					</Box>
				</Field>

				<Field>
					<FieldLabel>{t('form.requestTrialForm.hasWorkspace.label')}</FieldLabel>
					<FieldDescription>{t('form.requestTrialForm.hasWorkspace.description')}</FieldDescription>
				</Field>
			</FieldGroup>
			<FormFooter>
				<Button type='submit' primary loading={isValidating || isSubmitting} disabled={!isValid}>
					{t('form.requestTrialForm.button.text')}
				</Button>
			</FormFooter>
		</Form>
	);
};

export { RequestTrialForm as default };
