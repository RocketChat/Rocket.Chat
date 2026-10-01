import type { SelectOption } from '@rocket.chat/fuselage';
import { FieldError, FieldLabel, FieldRow, FieldGroup, Field, ButtonGroup, Button, TextInput, Select, Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { ActionLink, Form, FormContainer, FormFooter, FormHeader, FormSteps, FormSubtitle, FormTitle } from '@rocket.chat/layout';
import type { ReactNode } from 'react';
import { useRef, useEffect, useId } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type OrganizationInfoPayload = {
	organizationName: string;
	organizationIndustry: string;
	organizationSize: string;
	country: string;
};

type OrganizationInfoFormProps = {
	currentStep: number;
	stepCount: number;
	organizationIndustryOptions: SelectOption[];
	organizationSizeOptions: SelectOption[];
	countryOptions: SelectOption[];
	nextStep?: ReactNode;
	initialValues?: OrganizationInfoPayload;
	onSubmit: SubmitHandler<OrganizationInfoPayload>;
	onBackButtonClick?: () => void;
	onClickSkip?: () => void;
};

const OrganizationInfoForm = ({
	currentStep,
	stepCount,
	organizationIndustryOptions,
	organizationSizeOptions,
	countryOptions,
	nextStep,
	initialValues,
	onSubmit,
	onBackButtonClick,
	onClickSkip,
}: OrganizationInfoFormProps) => {
	const { t } = useTranslation();
	const breakpoints = useBreakpoints();
	const isMobile = !breakpoints.includes('md');

	const formId = useId();
	const organizationNameField = useId();
	const organizationIndustryField = useId();
	const organizationSizeField = useId();
	const countryField = useId();

	const organizationInfoFormRef = useRef<HTMLElement>(null);

	const {
		control,
		handleSubmit,
		formState: { isValidating, isSubmitting, errors },
	} = useForm<OrganizationInfoPayload>({
		defaultValues: initialValues,
		mode: 'onBlur',
	});

	useEffect(() => {
		if (organizationInfoFormRef.current) {
			organizationInfoFormRef.current.focus();
		}
	}, []);

	return (
		<Form
			ref={organizationInfoFormRef}
			tabIndex={-1}
			aria-labelledby={`${formId}-title`}
			aria-describedby={`${formId}-description`}
			onSubmit={handleSubmit(onSubmit)}
		>
			<FormHeader>
				<FormSteps currentStep={currentStep} stepCount={stepCount} />
				<FormTitle id={`${formId}-title`}>{t('form.organizationInfoForm.title')}</FormTitle>
				<FormSubtitle id={`${formId}-description`}>{t('form.organizationInfoForm.subtitle')}</FormSubtitle>
			</FormHeader>
			<FormContainer>
				<FieldGroup>
					<Field>
						<FieldLabel required htmlFor={organizationNameField}>
							{t('form.organizationInfoForm.fields.organizationName.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='organizationName'
								control={control}
								rules={{
									required: t('component.form.requiredField'),
								}}
								render={({ field }) => (
									<TextInput
										{...field}
										placeholder={t('form.organizationInfoForm.fields.organizationName.placeholder')}
										aria-describedby={`${organizationNameField}-error}`}
										aria-required='true'
										aria-invalid={Boolean(errors.organizationName)}
										id={organizationNameField}
									/>
								)}
							/>
						</FieldRow>
						{errors.organizationName && (
							<FieldError aria-live='assertive' id={`${organizationNameField}-error}`}>
								{t('component.form.requiredField')}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={organizationIndustryField}>
							{t('form.organizationInfoForm.fields.organizationIndustry.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='organizationIndustry'
								control={control}
								rules={{ required: t('component.form.requiredField') }}
								render={({ field }) => (
									<Select
										{...field}
										options={organizationIndustryOptions}
										placeholder={t('form.organizationInfoForm.fields.organizationIndustry.placeholder')}
										aria-required='true'
										aria-invalid={Boolean(errors.organizationIndustry)}
										aria-describedby={`${organizationIndustryField}-error}`}
										id={organizationIndustryField}
									/>
								)}
							/>
						</FieldRow>
						{errors.organizationIndustry && (
							<FieldError aria-live='assertive' id={`${organizationIndustryField}-error}`}>
								{t('component.form.requiredField')}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={organizationSizeField}>
							{t('form.organizationInfoForm.fields.organizationSize.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='organizationSize'
								control={control}
								rules={{ required: t('component.form.requiredField') }}
								render={({ field }) => (
									<Select
										{...field}
										options={organizationSizeOptions}
										placeholder={t('form.organizationInfoForm.fields.organizationSize.placeholder')}
										aria-required='true'
										aria-invalid={Boolean(errors.organizationSize)}
										aria-describedby={`${organizationSizeField}-error}`}
										id={organizationSizeField}
									/>
								)}
							/>
						</FieldRow>
						{errors.organizationSize && (
							<FieldError aria-live='assertive' id={`${organizationSizeField}-error}`}>
								{t('component.form.requiredField')}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel required htmlFor={countryField}>
							{t('form.organizationInfoForm.fields.country.label')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='country'
								control={control}
								rules={{ required: t('component.form.requiredField') }}
								render={({ field }) => (
									<Select
										{...field}
										options={countryOptions}
										placeholder={t('form.organizationInfoForm.fields.country.placeholder')}
										aria-required='true'
										aria-invalid={Boolean(errors.country)}
										aria-describedby={`${countryField}-error}`}
										id={countryField}
									/>
								)}
							/>
						</FieldRow>
						{errors.country && (
							<FieldError aria-live='assertive' id={`${countryField}-error}`}>
								{t('component.form.requiredField')}
							</FieldError>
						)}
					</Field>
				</FieldGroup>
			</FormContainer>
			<FormFooter>
				<ButtonGroup vertical={isMobile}>
					{onBackButtonClick && (
						<Button disabled={isSubmitting} onClick={onBackButtonClick}>
							{t('component.form.action.back')}
						</Button>
					)}
					<Button type='submit' primary loading={isValidating || isSubmitting}>
						{nextStep ?? t('component.form.action.next')}
					</Button>
					{onClickSkip && (
						<Box withTruncatedText flexGrow={1}>
							<ButtonGroup align='end'>
								<ActionLink onClick={onClickSkip}>{t('component.form.action.skip')}</ActionLink>
							</ButtonGroup>
						</Box>
					)}
				</ButtonGroup>
			</FormFooter>
		</Form>
	);
};

export default OrganizationInfoForm;
