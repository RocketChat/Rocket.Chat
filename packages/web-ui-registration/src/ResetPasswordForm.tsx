import { FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useSendForgotPassword } from './hooks/useSendForgotPassword';

export const ResetPasswordForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const { t } = useTranslation();
	const emailId = useId();
	const formLabelId = useId();
	const forgotPasswordFormRef = useRef<HTMLElement>(null);

	useDocumentTitle(t('registration.component.resetPassword'), false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<{
		email: string;
	}>({ mode: 'onBlur' });

	useEffect(() => {
		if (forgotPasswordFormRef.current) {
			forgotPasswordFormRef.current.focus();
		}
	}, []);

	const { mutateAsync, isSuccess } = useSendForgotPassword();

	return (
		<Form
			ref={forgotPasswordFormRef}
			tabIndex={-1}
			aria-labelledby={formLabelId}
			aria-describedby='welcomeTitle'
			onSubmit={handleSubmit((data) => {
				mutateAsync({ email: data.email });
			})}
		>
			<Form.Header>
				<Form.Title id={formLabelId}>{t('registration.component.resetPassword')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<FieldLabel required htmlFor={emailId}>
							{t('registration.component.form.email')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								{...register('email', {
									required: t('Required_field', { field: t('registration.component.form.email') }),
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: t('registration.page.resetPassword.errors.invalidEmail'),
									},
								})}
								error={errors.email?.message}
								aria-invalid={Boolean(errors.email)}
								aria-required='true'
								aria-describedby={`${emailId}-error`}
								placeholder={t('registration.component.form.emailPlaceholder')}
								id={emailId}
							/>
						</FieldRow>
						{errors.email && (
							<FieldError aria-live='assertive' id={`${emailId}-error`}>
								{errors.email.message}
							</FieldError>
						)}
					</Field>
				</FieldGroup>
				{isSuccess && (
					<FieldGroup>
						<Callout aria-live='assertive' role='status' mbs={24} icon='mail'>
							{t('registration.page.resetPassword.sent')}
						</Callout>
					</FieldGroup>
				)}
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' loading={isSubmitting} primary>
						{t('registration.page.resetPassword.sendInstructions')}
					</Button>
				</ButtonGroup>
				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					{t('registration.page.register.back')}
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default ResetPasswordForm;
