import React, { useState, useCallback } from 'react';
import { Button, TextInput, Field, Modal, Box, Throbber } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../contexts/TranslationContext';
import { useUser } from '../../contexts/UserContext';
import { useMethodData, useMethod } from '../../contexts/ServerContext';
import { useRouteParameter } from '../../contexts/RouterContext';

const getChangePasswordReason = ({
	requirePasswordChange,
	requirePasswordChangeReason = requirePasswordChange
		? 'You_need_to_change_your_password'
		: 'Please_enter_your_new_password_below',
} = {}) => requirePasswordChangeReason;


const ResetPassword = ({ resetPassword }) => {
	const user = useUser();
	const t = useTranslation();
	const [{ enabled: policyEnabled, policy: policies } = {}] = useMethodData('getPasswordPolicy');


	const setUserPassword = useMethod('setUserPassword');
	const token = useRouteParameter('token');

	const changePasswordReason = getChangePasswordReason(user || {});

	const [newPassword, setNewPassword] = useState('');
	const [isLoading, setIsLoading] = useSafely(useState(false));
	const [error, setError] = useSafely(useState());


	const handleOnChange = useCallback((event) => setNewPassword(event.currentTarget.value), [setNewPassword]);

	const isSubmitDisabled = !newPassword.trim() || isLoading;

	const handleSubmit = useCallback(async (e) => {
		e.preventDefault();
		if (isSubmitDisabled) {
			return;
		}
		setIsLoading(true);
		try {
			if (token && resetPassword) {
				await resetPassword(token, newPassword);
			} else {
				await setUserPassword(newPassword);
			}
		} catch ({ error, reason = error }) {
			setError(reason);
		} finally {
			setIsLoading(false);
		}
	}, [newPassword, isSubmitDisabled, setUserPassword, resetPassword]);

	return (
		<Modal is='form' onSubmit={handleSubmit}>
			<Modal.Header>
				<Modal.Title textAlign='start'>{t('Password')}</Modal.Title>
			</Modal.Header>
			<Modal.Content>
				<Box is='p' fontScale='h2'>
					{t(changePasswordReason)}
				</Box>
				<Field>
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
								<p key={index}>{t(...policy)}</p>
							))}
						</Field.Hint>
					)}
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Field>
					<Field.Row>
						<Button
							primary
							disabled={isSubmitDisabled}
							type='submit'
						>
							{isLoading ? <Throbber size='x12' inheritColor /> : t('Reset')}
						</Button>
					</Field.Row>
				</Field>
			</Modal.Footer>
		</Modal>
	);
};

export default ResetPassword;
