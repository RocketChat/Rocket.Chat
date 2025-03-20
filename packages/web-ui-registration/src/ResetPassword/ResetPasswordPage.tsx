import type { IUser } from '@rocket.chat/core-typings';
import { Button, FieldGroup, Field, FieldLabel, ButtonGroup, PasswordInput, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { Form } from '@rocket.chat/layout';
import { PasswordVerifier, useValidatePassword } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useRouter, useRouteParameter, useUser, useMethod, useTranslation, useLoginWithToken } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import HorizontalTemplate from '../template/HorizontalTemplate';

const getChangePasswordReason = ({
	requirePasswordChange,
	requirePasswordChangeReason = requirePasswordChange ? 'You_need_to_change_your_password' : 'Please_enter_your_new_password_below',
}: Pick<IUser, 'requirePasswordChange' | 'requirePasswordChangeReason'> = {}) => requirePasswordChangeReason as TranslationKey;

const ResetPasswordPage = (): ReactElement => {
	const user = useUser();
	const t = useTranslation();
	const setUserPassword = useMethod('setUserPassword');
	const resetPassword = useMethod('resetPassword');
	const token = useRouteParameter('token');

	const resetPasswordFormRef = useRef<HTMLElement>(null);
	const passwordId = useId();
	const passwordConfirmationId = useId();
	const passwordVerifierId = useId();
	const formLabelId = useId();

	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation', true);
	const passwordPlaceholder = useSetting('Accounts_PasswordPlaceholder', '');
	const passwordConfirmationPlaceholder = useSetting('Accounts_ConfirmPasswordPlaceholder', '');

	const router = useRouter();

	const changePasswordReason = getChangePasswordReason(user || {});

	const loginWithToken = useLoginWithToken();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
		watch,
	} = useForm<{
		password: string;
		passwordConfirmation: string;
	}>({
		mode: 'onBlur',
	});

	const password = watch('password');
	const passwordIsValid = useValidatePassword(password);

	useEffect(() => {
		if (resetPasswordFormRef.current) {
			resetPasswordFormRef.current.focus();
		}
	}, []);

	const handleResetPassword = async ({ password }: { password: string }) => {
		try {
			if (token) {
				const result = await resetPassword(token, password);
				await loginWithToken(result.token);
				router.navigate('/home');
			} else {
				await setUserPassword(password);
			}
		} catch ({ error, reason }: any) {
			const _error = reason ?? error;
			setError('password', { message: String(_error) });
		}
	};

	return (
		<HorizontalTemplate>
			<Form
				tabIndex={-1}
				ref={resetPasswordFormRef}
				aria-labelledby={formLabelId}
				aria-describedby='welcomeTitle'
				onSubmit={handleSubmit(handleResetPassword)}
			>
				<Form.Header>
					<Form.Title id={formLabelId}>{t('Reset_password')}</Form.Title>
					<Form.Subtitle>{t(changePasswordReason)}</Form.Subtitle>
				</Form.Header>
				<Form.Container>
					<FieldGroup>
						<Field>
							<FieldLabel required htmlFor={passwordId}>
								{t('registration.component.form.password')}
							</FieldLabel>
							<FieldRow>
								<PasswordInput
									{...register('password', {
										required: t('registration.component.form.requiredField'),
										validate: () => (!passwordIsValid ? t('Password_must_meet_the_complexity_requirements') : true),
									})}
									error={errors?.password?.message}
									aria-invalid={errors.password ? 'true' : 'false'}
									aria-required='true'
									id={passwordId}
									placeholder={passwordPlaceholder || t('Create_a_password')}
									aria-describedby={`${passwordVerifierId} ${passwordId}-error`}
								/>
							</FieldRow>
							{errors?.password && (
								<FieldError aria-live='assertive' id={`${passwordId}-error`}>
									{errors.password.message}
								</FieldError>
							)}
							<PasswordVerifier password={password} id={passwordVerifierId} />
						</Field>
						{requiresPasswordConfirmation && (
							<Field>
								<FieldLabel required htmlFor={passwordConfirmationId}>
									{t('registration.component.form.confirmPassword')}
								</FieldLabel>
								<FieldRow>
									<PasswordInput
										{...register('passwordConfirmation', {
											required: t('registration.component.form.requiredField'),
											deps: ['password'],
											validate: (val: string) => (password === val ? true : t('registration.component.form.invalidConfirmPass')),
										})}
										error={errors?.passwordConfirmation?.message}
										aria-required='true'
										aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
										aria-describedby={`${passwordConfirmationId}-error`}
										id={passwordConfirmationId}
										placeholder={passwordConfirmationPlaceholder || t('Confirm_password')}
										disabled={!passwordIsValid}
									/>
								</FieldRow>
								{errors.passwordConfirmation && (
									<FieldError aria-live='assertive' id={`${passwordConfirmationId}-error`}>
										{errors.passwordConfirmation?.message}
									</FieldError>
								)}
							</Field>
						)}
					</FieldGroup>
				</Form.Container>
				<Form.Footer>
					<ButtonGroup>
						<Button primary loading={isSubmitting} type='submit'>
							{t('Reset')}
						</Button>
					</ButtonGroup>
				</Form.Footer>
			</Form>
		</HorizontalTemplate>
	);
};

export default ResetPasswordPage;
