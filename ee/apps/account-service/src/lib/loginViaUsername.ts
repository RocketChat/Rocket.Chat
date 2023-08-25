import type { ILoginResult } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { saveSession } from './saveSession';
import { _generateStampedLoginToken, _hashStampedToken, _tokenExpiration, validatePassword } from './utils';

export async function loginViaUsername(
	{ username }: { username: string },
	password: string,
	loginExpiration: number,
): Promise<false | ILoginResult> {
	const user = await Users.findOne<IUser>({ username }, { projection: { 'services.password.bcrypt': 1 } });
	if (!user) {
		return false;
	}

	const valid = user.services?.password?.bcrypt && validatePassword(password, user.services.password.bcrypt);
	if (!valid) {
		return false;
	}

	const newToken = _generateStampedLoginToken();

	const hashedToken = _hashStampedToken(newToken);

	await saveSession(user._id, hashedToken);

	return {
		uid: user._id,
		token: newToken.token,
		hashedToken: hashedToken.hashedToken,
		tokenExpires: _tokenExpiration(newToken.when, loginExpiration),
		type: 'password',
	};
}
