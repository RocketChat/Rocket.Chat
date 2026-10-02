import { escapeRegExp, validateEmail } from '@rocket.chat/tools';
import { useSetting, usePasswordPolicy, usePasswordPolicyOptions, useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const toRegExp = (username: string): RegExp => new RegExp(`^${escapeRegExp(username).trim()}$`, 'i');
const usernameBlackList = ['all', 'here', 'admin'].map(toRegExp);
const hasBlockedName = (username: string): boolean =>
	!!usernameBlackList.length && usernameBlackList.some((restrictedUsername) => restrictedUsername.test(escapeRegExp(username).trim()));

/** Answers whether what the first admin typed is acceptable, so the pages only have to show the answer. */
export const useSetupWizardValidators = () => {
	const { t } = useTranslation();

	const regexpForUsernameValidation = useSetting('UTF8_User_Names_Validation', '[0-9a-zA-Z-_.]+');
	const usernameRegExp = useMemo(() => new RegExp(`^${regexpForUsernameValidation}$`), [regexpForUsernameValidation]);

	const passwordPolicyOptions = usePasswordPolicyOptions();
	const validatePasswordPolicy = usePasswordPolicy(passwordPolicyOptions);
	const passwordPolicyValidations = useVerifyPassword('');

	const passwordRulesHint = useMemo(() => {
		if (!passwordPolicyValidations.validations || passwordPolicyValidations.validations.length === 0) {
			return '';
		}

		return passwordPolicyValidations.validations
			.map((validation) => {
				const labelKey = `${validation.name}-label` as const;
				if ('limit' in validation) {
					return t(labelKey, { limit: validation.limit });
				}
				return t(labelKey);
			})
			.join(', ');
	}, [passwordPolicyValidations.validations, t]);

	// TODO: check if username exists
	const validateUsername = useCallback(
		(username: string): true | string => {
			if (!usernameRegExp.test(username) || hasBlockedName(username)) {
				return t('Invalid_username');
			}

			return true;
		},
		[usernameRegExp, t],
	);

	const validatePassword = useCallback(
		(password: string): true | string => {
			if (!password || password.length === 0) {
				return t('Required_field', { field: t('Password') });
			}

			if (!validatePasswordPolicy(password).valid) {
				return t('Password_must_meet_the_complexity_requirements');
			}

			return true;
		},
		[validatePasswordPolicy, t],
	);

	const validateEmailAddress = useCallback(
		(email: string): true | string => {
			if (!validateEmail(email)) {
				return t('Invalid_email');
			}

			return true;
		},
		[t],
	);

	return useMemo(
		() => ({
			validateEmail: validateEmailAddress,
			validateUsername,
			validatePassword,
			passwordRulesHint,
		}),
		[validateEmailAddress, validateUsername, validatePassword, passwordRulesHint],
	);
};
