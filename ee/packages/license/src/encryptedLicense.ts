let lockedLicense: string | undefined;

export const lockLicense = (encryptedLicense: string) => {
	lockedLicense = encryptedLicense;
};

export const isLicenseDuplicate = (encryptedLicense: string) => Boolean(lockedLicense && lockedLicense === encryptedLicense);
