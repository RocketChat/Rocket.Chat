import decrypt from '../decrypt';

export const validateFormat = (encryptedLicense: string): boolean => {
	if (!encryptedLicense || String(encryptedLicense).trim() === '') {
		return false;
	}

	const decrypted = decrypt(encryptedLicense);
	if (!decrypted) {
		return false;
	}

	return true;
};
