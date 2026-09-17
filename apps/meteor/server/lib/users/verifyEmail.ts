import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function verifyEmail(user: Pick<IUser, '_id' | 'services' | 'emails'>, token: string): Promise<boolean> {
	if (user.services?.email?.verificationTokens?.length === 0) {
		throw new Error('error-invalid-token');
	}

	const tokenRecord = await user.services?.email?.verificationTokens?.find((t) => t.token === token);
	if (!tokenRecord) {
		throw new Error('error-invalid-token');
	}

	const emailsRecord = user.emails?.find((e) => e.address === tokenRecord.address);

	if (!emailsRecord) {
		throw new Error('error-invalid-token');
	}

	const result = await Users.verifyEmailByAddress(user._id, tokenRecord.address);
	if (result.modifiedCount === 0) {
		throw new Error('error-invalid-token');
	}

	return true;
}
