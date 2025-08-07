import type { IUser } from '@rocket.chat/core-typings';
import type { CallActorType } from '@rocket.chat/media-signaling';
import { Users } from '@rocket.chat/models';

export async function mutateCallee(callee: { type: CallActorType; id: string }): Promise<{ type: CallActorType; id: string }> {
	if (callee.type !== 'sip') {
		return callee;
	}

	const user = await Users.findOneByFreeSwitchExtension<Pick<IUser, '_id'>>(callee.id, { projection: { _id: 1 } });
	if (user) {
		return { type: 'user', id: user._id };
	}

	return callee;
}
