import { Button, Field, Modal, PasswordInput } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetting,
	useVerifyPassword,
	useRouteParameter,
	useRoute,
	useUser,
	useMethod,
	useTranslation,
	useLoginWithToken,
} from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Form } from '@rocket.chat/layout';
import { useForm } from 'react-hook-form';
import { PasswordVerifier } from '@rocket.chat/ui-client';

import HorizontalTemplate from '../template/HorizontalTemplate';

const getChangePasswordReason = ({
	requirePasswordChange,
	requirePasswordChangeReason = requirePasswordChange ? 'You_need_to_change_your_password' : 'Please_enter_your_new_password_below',
}: { requirePasswordChange?: boolean; requirePasswordChangeReason?: TranslationKey } = {}): TranslationKey => requirePasswordChangeReason;

const ResetPasswordPage = (): ReactElement => {
	const user = useUser();
	const t = useTranslation();
	const setUserPassword = useMethod('setUserPassword');
	const resetPassword = useMethod('resetPassword');
	const token = useRouteParameter('token');

	const requiresPasswordConfirmation = useSetting('Accounts_RequirePasswordConfirmation');

	const homeRouter = useRoute('home');

	const changePasswordReason = getChangePasswordReason(user || {});

	const loginWithToken = useLoginWithToken();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
		formState,
		watch,
	} = useForm<{
		password: string;
		passwordConfirmation: string;
	}>({
		mode: 'onChange',
	});

	const passwordVerifications = useVerifyPassword(watch('password'));

	const submit = handleSubmit(async (data) => {
		try {
			if (token) {
				const result = await resetPassword(token, data.password);
				await loginWithToken(result.token);
				homeRouter.push({});
			} else {
				await setUserPassword(data.password);
			}
		} catch ({ error, reason }: any) {
			const _error = reason ?? error;
			setError('password', { message: String(_error) });
		}
	});

	return (
		<HorizontalTemplate>
			<Form onSubmit={submit}>
				<Form.Header>
					<Modal.Title textAlign='start'>{t('Reset_password')}</Modal.Title>
				</Form.Header>
				<Form.Container>
					<Field>
						<Field.Label htmlFor='password'>{t(changePasswordReason)}</Field.Label>
						<Field.Row>
							<PasswordInput
								{...register('password', {
									required: true,
								})}
								error={errors.password?.message}
								aria-invalid={errors.password ? 'true' : 'false'}
								id='password'
								placeholder={t('Create_a_password')}
								name='password'
								autoComplete='off'
							/>
						</Field.Row>
						{requiresPasswordConfirmation && (
							<Field.Row>
								<PasswordInput
									{...register('passwordConfirmation', {
										required: true,
										deps: ['password'],
										validate: (val: string) => watch('password') === val,
									})}
									error={errors.passwordConfirmation?.type === 'validate' ? t('registration.component.form.invalidConfirmPass') : undefined}
									aria-invalid={errors.passwordConfirmation ? 'true' : false}
									id='passwordConfirmation'
									placeholder={t('Confirm_password')}
								/>
							</Field.Row>
						)}
						{errors && <Field.Error>{errors.password?.message}</Field.Error>}
						{passwordVerifications && <PasswordVerifier password={watch('password')} passwordVerifications={passwordVerifications} />}
					</Field>
				</Form.Container>
				<Form.Footer>
					<Modal.FooterControllers>
						<Button primary disabled={!formState.isValid} type='submit'>
							{t('Reset')}
						</Button>
					</Modal.FooterControllers>
				</Form.Footer>
			</Form>
		</HorizontalTemplate>
	);
};

export default ResetPasswordPage;
