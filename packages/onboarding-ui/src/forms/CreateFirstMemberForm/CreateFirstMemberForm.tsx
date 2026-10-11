import {
	FieldGroup,
	Field,
	ButtonGroup,
	Button,
	Box,
	PasswordInput,
	TextInput,
	Throbber,
	FieldLabel,
	FieldRow,
	FieldError,
} from '@rocket.chat/fuselage';
import { Form, FormFooter, FormSteps, FormSubtitle, FormTitle } from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type CreateFirstMemberFormPayload = {
	username: string;
	password: string;
};

export type CreateFirstMemberFormProps = {
	defaultValues?: CreateFirstMemberFormPayload;
	currentStep: number;
	stepCount: number;
	organizationName: string;
	onSubmit: SubmitHandler<CreateFirstMemberFormPayload>;
	onBackButtonClick: () => void;
	validateUsername: Validate<FieldPathValue<CreateFirstMemberFormPayload, 'username'>, CreateFirstMemberFormPayload>;
	validatePassword: Validate<FieldPathValue<CreateFirstMemberFormPayload, 'password'>, CreateFirstMemberFormPayload>;
};

export const CreateFirstMemberForm = ({
	defaultValues,
	currentStep,
	stepCount,
	organizationName,
	onSubmit,
	onBackButtonClick,
	validateUsername,
	validatePassword,
}: CreateFirstMemberFormProps) => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { isValid, isValidating, isSubmitting, errors },
	} = useForm<CreateFirstMemberFormPayload>({ mode: 'onChange' });

	return (
		<Form onSubmit={handleSubmit(onSubmit)}>
			<FormSteps currentStep={currentStep} stepCount={stepCount} />
			<FormTitle>{t('form.createFirstMemberForm.title')}</FormTitle>
			<FormSubtitle>{t('form.createFirstMemberForm.subtitle', { organizationName })}</FormSubtitle>

			<FieldGroup marginBlockStart={16}>
				<Field>
					<FieldLabel>
						<Box display='inline' marginInlineEnd={8}>
							{t('form.createFirstMemberForm.fields.username.label')}
						</Box>
					</FieldLabel>
					<FieldRow>
						<TextInput
							{...register('username', {
								validate: validateUsername,
								required: true,
							})}
							defaultValue={defaultValues?.username}
							error={errors?.username?.type || undefined}
						/>
					</FieldRow>
					{errors?.username && <FieldError>{errors.username.message}</FieldError>}
				</Field>

				<Field>
					<FieldLabel>{t('form.createFirstMemberForm.fields.password.label')}</FieldLabel>
					<FieldRow>
						<PasswordInput
							{...register('password', {
								validate: validatePassword,
								required: true,
							})}
							defaultValue={defaultValues?.password}
						/>
					</FieldRow>
					{errors.password && <FieldError>{errors.password.message}</FieldError>}
				</Field>
			</FieldGroup>

			<FormFooter>
				<ButtonGroup>
					<Button disabled={isSubmitting} onClick={onBackButtonClick}>
						{t('component.form.action.back')}
					</Button>

					<Button type='submit' primary disabled={!isValid} loading={isSubmitting || isValidating} minHeight='x40'>
						{isSubmitting ? <Throbber inheritColor /> : t('form.createFirstMemberForm.button.submit')}
					</Button>
				</ButtonGroup>
			</FormFooter>
		</Form>
	);
};

export { CreateFirstMemberForm as default };
