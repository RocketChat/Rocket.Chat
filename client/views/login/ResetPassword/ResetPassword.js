import { Button, TextInput, Field, Modal, Box, Throbber } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { Meteor } from 'meteor/meteor';
import React, { useState, useCallback, useMemo } from 'react';

import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUser } from '../../../contexts/UserContext';
import { useMethodData } from '../../../hooks/useMethodData';
import LoginLayout from '../LoginLayout';

const getChangePasswordReason = ({
	requirePasswordChange,
	requirePasswordChangeReason = requirePasswordChange ? 'You_need_to_change_your_password' : 'Please_enter_your_new_password_below',
} = {}) => requirePasswordChangeReason;

const ResetPassword = () => {
	const user = useUser();
	const t = useTranslation();
	const setUserPassword = useMethod('setUserPassword');
	const resetPassword = useMethod('resetPassword');
	const token = useRouteParameter('token');
	const params = useMemo(
		() => [
			{
				token,
			},
		],
		[token],
	);

	const { value: { enabled: policyEnabled, policy: policies } = {} } = useMethodData('getPasswordPolicy', params);

	const router = useRoute('home');

	const changePasswordReason = getChangePasswordReason(user || {});

	const [newPassword, setNewPassword] = useState('');
	const [isLoading, setIsLoading] = useSafely(useState(false));
	const [error, setError] = useSafely(useState());

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
			} catch ({ error, reason = error }) {
				setError(reason);
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
							<TextInput
								placeholder={t('Type_your_new_password')}
								type='password'
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
								{policies.map((policy, index) => (
									<Box is='p' textAlign='start' key={index}>
										{t(...policy)}
									</Box>
								))}
							</Field.Hint>
						)}
					</Field>
				</Modal.Content>
				<Modal.Footer>
					<Field>
						<Field.Row>
							<Button primary disabled={isSubmitDisabled} type='submit'>
								{isLoading ? <Throbber size='x12' inheritColor /> : t('Reset')}
							</Button>
						</Field.Row>
					</Field>
				</Modal.Footer>
			</Modal>
		</LoginLayout>
	);
};

export default ResetPassword;
