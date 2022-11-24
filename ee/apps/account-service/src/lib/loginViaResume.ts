import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { _hashLoginToken, _tokenExpiration } from './utils';
import type { ILoginResult } from '../../../../../apps/meteor/server/sdk/types/IAccount';
import { MeteorError } from '../../../../../apps/meteor/server/sdk/errors';

export async function loginViaResume(resume: string, loginExpiration: number): Promise<false | ILoginResult> {
	const hashedToken = _hashLoginToken(resume);

	const user = await Users.findOne<IUser>(
		{
			'services.resume.loginTokens.hashedToken': hashedToken,
		},
		{
			projection: {
				'services.resume.loginTokens': 1,
			},
		},
	);
	if (!user) {
		return false;
	}

	const { when } = user.services?.resume?.loginTokens?.find((token) => token.hashedToken === hashedToken) || {};

	const tokenExpires = when && _tokenExpiration(when, loginExpiration);
	if (tokenExpires && new Date() >= tokenExpires) {
		throw new MeteorError(403, 'Your session has expired. Please log in again.');
	}

	return {
		uid: user._id,
		token: resume,
		hashedToken,
		type: 'resume',
		...(tokenExpires && { tokenExpires }),
	};
}
