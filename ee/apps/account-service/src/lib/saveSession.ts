import { Users } from '@rocket.chat/models';

import type { IHashedStampedToken } from './utils';

export async function saveSession(uid: string, newToken: IHashedStampedToken): Promise<void> {
	await Users.updateOne(
		{ _id: uid },
		{
			$push: {
				'services.resume.loginTokens': newToken.hashedToken,
			},
		},
	);
}
