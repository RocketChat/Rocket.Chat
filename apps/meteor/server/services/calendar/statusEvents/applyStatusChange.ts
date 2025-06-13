import { api } from '@rocket.chat/core-services';
import { UserStatus, type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function applyStatusChange({ uid, status }: { uid: IUser['_id']; status: UserStatus }): Promise<void> {
	const user = await Users.findOneById(uid, { projection: { roles: 1, username: 1, name: 1, status: 1 } });
	if (!user || user.status === UserStatus.OFFLINE) {
		return;
	}

	const newStatus = status ?? UserStatus.BUSY;
	const previousStatus = user.status;

	await Users.updateStatusAndStatusDefault(uid, newStatus, newStatus);

	await api.broadcast('presence.status', {
		user: {
			status: newStatus,
			_id: uid,
			roles: user.roles,
			username: user.username,
			name: user.name,
		},
		previousStatus,
	});
}
