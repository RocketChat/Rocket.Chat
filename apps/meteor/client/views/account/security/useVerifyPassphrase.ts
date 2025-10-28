import { PasswordPolicy } from '@rocket.chat/password-policies';
import { useMemo } from 'react';

const validator = new PasswordPolicy({
	enabled: true,
	minLength: 30,
	mustContainAtLeastOneLowercase: true,
	mustContainAtLeastOneUppercase: true,
	mustContainAtLeastOneNumber: true,
	mustContainAtLeastOneSpecialCharacter: true,
	forbidRepeatingCharacters: false,
});

type PassphraseVerifications = { isValid: boolean; limit?: number; name: string }[];

export const useVerifyPassphrase = (passphrase: string): PassphraseVerifications => {
	return useMemo(() => validator.sendValidationMessage(passphrase || ''), [passphrase]);
};

export const useValidatePassphrase = (passphrase: string): boolean => {
	const passphraseVerifications = useVerifyPassphrase(passphrase);

	return useMemo(() => passphraseVerifications.every(({ isValid }) => isValid), [passphraseVerifications]);
};
