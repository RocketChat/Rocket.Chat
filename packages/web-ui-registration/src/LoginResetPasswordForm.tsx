import { FieldGroup, TextInput, Field, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';
import { useSendForgotPassword } from './hooks/useSendForgotPassword';

export const LoginResetPasswordForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const t = useTranslation();

	const [sent, setSent] = useState<boolean>(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<{
		email: string;
	}>();

	const resetPassword = useSendForgotPassword();

	return (
		<Form
			onSubmit={handleSubmit((data) => {
				resetPassword({ email: data.email });
				setSent(true);
			})}
		>
			<Form.Header>
				<Form.Title>{t('Reset_password')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='email'>{t('Email')}</Field.Label>
						<Field.Row>
							<TextInput
								{...register('email', {
									required: true,
								})}
								error={errors.email && t('onboarding.component.form.requiredField')}
								aria-invalid={errors?.email?.type === 'required'}
								placeholder={t('Email_Placeholder')}
								id='email'
							/>
						</Field.Row>
						{errors.email && <Field.Error>{t('onboarding.component.form.requiredField')}</Field.Error>}
					</Field>
				</FieldGroup>
				{sent && (
					<FieldGroup>
						<Callout type='warning'>{t('If_this_email_is_registered')}</Callout>
					</FieldGroup>
				)}
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' primary>
						{t('Submit')}
					</Button>
				</ButtonGroup>

				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					Back to Login
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default LoginResetPasswordForm;
