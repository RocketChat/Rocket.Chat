import { Button, Field, Modal, Box, Throbber, PasswordInput, InputBoxSkeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouteParameter, useRoute, useUser, useMethod, useTranslation, useLoginWithToken } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Form } from '@rocket.chat/layout';
import { useForm } from 'react-hook-form';

import HorizontalTemplate from '../template/HorizontalTemplate';
import { usePasswordPolicy } from '../hooks/usePasswordPolicy';

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

	const policies = usePasswordPolicy({
		token: user ? undefined : token,
	});

	const homeRouter = useRoute('home');

	const changePasswordReason = getChangePasswordReason(user || {});

	const loginWithToken = useLoginWithToken();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
		formState,
	} = useForm<{
		password: string;
	}>({
		mode: 'onChange',
	});

	const submit = handleSubmit(async (data) => {
		try {
			if (token) {
				const result = await resetPassword(token, data.password);
				await loginWithToken(result.token);
				homeRouter.push({});
			} else {
				await setUserPassword(data.password);
			}
		} catch ({ error, reason }) {
			const _error = reason ?? error;
			setError('password', { message: String(_error) });
		}
	});

	return (
		<HorizontalTemplate>
			<Form onSubmit={submit}>
				<Form.Header>
					<Modal.Title textAlign='start'>{t('Password')}</Modal.Title>
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
								placeholder={t('Type_your_new_password')}
								name='password'
								autoComplete='off'
							/>
						</Field.Row>
						{errors && <Field.Error>{errors.password?.message}</Field.Error>}
						<Field.Hint>
							{policies.isLoading && <InputBoxSkeleton />}
							{policies.isSuccess &&
								policies.data.enabled &&
								policies.data.policy?.map((policy, index) => (
									<Box is='p' textAlign='start' key={index}>
										{t(...(policy as unknown as [name: TranslationKey, options?: Record<string, unknown>]))}
									</Box>
								))}
						</Field.Hint>
					</Field>
				</Form.Container>
				<Form.Footer>
					<Modal.FooterControllers>
						<Button primary disabled={!formState.isValid} type='submit'>
							{formState.isSubmitting ? <Throbber size='x12' inheritColor /> : t('Reset')}
						</Button>
					</Modal.FooterControllers>
				</Form.Footer>
			</Form>
		</HorizontalTemplate>
	);
};

export default ResetPasswordPage;
