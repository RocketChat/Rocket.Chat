import { getBaseUserFields } from '@rocket.chat/rest-typings';

type UserFields = {
	[k: string]: number;
};

export const getDefaultUserFields = (): UserFields => ({
	...getBaseUserFields(true),
	'services.github': 1,
	'services.gitlab': 1,
	'services.password.bcrypt': 1,
});
