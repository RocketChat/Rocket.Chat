import { Button, Field, Modal, Box, Throbber, PasswordInput } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import {
	useRouteParameter,
	useRoute,
	useUser,
	useMethod,
	useTranslation,
	TranslationKey,
	useToastMessageDispatch,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { Meteor } from 'meteor/meteor';
import React, { useState, useCallback, ReactElement } from 'react';

import LoginLayout from '../LoginLayout';

const getChangePasswordReason = ({
	requirePasswordChange,
	requirePasswordChangeReason = requirePasswordChange ? 'You_need_to_change_your_password' : 'Please_enter_your_new_password_below',
}: { requirePasswordChange?: boolean; requirePasswordChangeReason?: TranslationKey } = {}): TranslationKey => requirePasswordChangeReason;

const ResetPassword = (): ReactElement => {
	const user = useUser();
	const t = useTranslation();
	const setUserPassword = useMethod('setUserPassword');
	const resetPassword = useMethod('resetPassword');
	const token = useRouteParameter('token');

	const getPasswordPolicy = useEndpoint('GET', '/v1/pw.getPolicy');
	const getPasswordPolicyRest = useEndpoint('GET', '/v1/pw.getPolicyReset');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data: { enabled: policyEnabled, policy: policies } = {} } = useQuery(
		['login/password-policy', token],
		async () => (user || !token ? getPasswordPolicy() : getPasswordPolicyRest({ token })),
		{
			onError: (error: any) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	const router = useRoute('home');

	const changePasswordReason = getChangePasswordReason(user || {});

	const [newPassword, setNewPassword] = useState('');
	const [isLoading, setIsLoading] = useSafely(useState(false));
	const [error, setError] = useSafely(useState<string | undefined>());

	const handleOnChange = useCallback((event) => setNewPassword(event.currentTarget.value), [setNewPassword]);

	const isSubmitDisabled = !newPassword.trim() || isLoading;

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			if (isSubmitDisabled) {
				return;
			}
			setIsLoading(true);
			try {
				if (token && resetPassword) {
					const result = await resetPassword(token, newPassword);
					await Meteor.loginWithToken(result.token);
					router.push({});
				} else {
					await setUserPassword(newPassword);
				}
			} catch ({ error, reason }) {
				const _error = reason ?? error;
				setError(_error ? String(_error) : undefined);
			} finally {
				setIsLoading(false);
			}
		},
		[isSubmitDisabled, setIsLoading, token, resetPassword, newPassword, router, setUserPassword, setError],
	);

	return (
		<LoginLayout>
			<Modal is='form' onSubmit={handleSubmit}>
				<Modal.Header>
					<Modal.Title textAlign='start'>{t('Password')}</Modal.Title>
				</Modal.Header>
				<Modal.Content>
					<Field>
						<Field.Label>{t(changePasswordReason)}</Field.Label>
						<Field.Row>
							<PasswordInput
								placeholder={t('Type_your_new_password')}
								name='newPassword'
								id='newPassword'
								dir='auto'
								onChange={handleOnChange}
								autoComplete='off'
								value={newPassword}
							/>
						</Field.Row>
						{error && <Field.Error>{error}</Field.Error>}
						{policyEnabled && (
							<Field.Hint>
								{policies?.map((policy, index) => (
									<Box is='p' textAlign='start' key={index}>
										{t(...(policy as unknown as [name: TranslationKey, options?: Record<string, unknown>]))}
									</Box>
								))}
							</Field.Hint>
						)}
					</Field>
				</Modal.Content>
				<Modal.Footer>
					<Modal.FooterControllers>
						<Button primary disabled={isSubmitDisabled} type='submit'>
							{isLoading ? <Throbber size='x12' inheritColor /> : t('Reset')}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</LoginLayout>
	);
};

export default ResetPassword;
