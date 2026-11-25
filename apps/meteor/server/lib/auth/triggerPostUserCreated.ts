import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

// Tells apps about a new user once its creation flow wrote everything; never fails the creation
export async function triggerPostUserCreated(userId: IUser['_id'], performedBy?: IUser): Promise<void> {
	if (!Apps.self?.isLoaded()) {
		return;
	}

	try {
		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}

		await Apps.self?.triggerEvent(AppEvents.IPostUserCreated, { user, performedBy });
	} catch (err) {
		Apps.self?.getRocketChatLogger().error({ msg: 'Error while executing post user created event', err });
	}
}
