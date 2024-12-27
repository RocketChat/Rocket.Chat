import { getBaseUserFields } from './getBaseUserFields';

type UserFields = {
	[k: string]: number;
};

export const getDefaultUserFields = (): UserFields => ({
	...getBaseUserFields(),
	'services.github': 1,
	'services.gitlab': 1,
	'services.password.bcrypt': 1,
	'services.totp.enabled': 1,
	'services.email2fa.enabled': 1,
});
