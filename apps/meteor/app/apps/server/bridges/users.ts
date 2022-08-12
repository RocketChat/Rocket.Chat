import { Random } from 'meteor/random';
import { UserPresence } from 'meteor/konecty:user-presence';
import { UserBridge } from '@rocket.chat/apps-engine/server/bridges/UserBridge';
import type { IUserCreationOptions, IUser } from '@rocket.chat/apps-engine/definition/users';
import { Subscriptions, Users as UsersRaw } from '@rocket.chat/models';

import { setUserAvatar, checkUsernameAvailability, deleteUser } from '../../../lib/server/functions';
import { Users } from '../../../models/server';
import type { AppServerOrchestrator } from '../orchestrator';

export class AppUserBridge extends UserBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getById(userId: string, appId: string): Promise<IUser> {
		this.orch.debugLog(`The App ${appId} is getting the userId: "${userId}"`);

		return this.orch.getConverters()?.get('users').convertById(userId);
	}

	protected async getByUsername(username: string, appId: string): Promise<IUser> {
		this.orch.debugLog(`The App ${appId} is getting the username: "${username}"`);

		return this.orch.getConverters()?.get('users').convertByUsername(username);
	}

	protected async getAppUser(appId?: string): Promise<IUser | undefined> {
		this.orch.debugLog(`The App ${appId} is getting its assigned user`);

		const user = Users.findOneByAppId(appId, {});

		return this.orch.getConverters()?.get('users').convertToApp(user);
	}

	protected async create(userDescriptor: Partial<IUser>, appId: string, options?: IUserCreationOptions): Promise<string> {
		this.orch.debugLog(`The App ${appId} is requesting to create a new user.`);
		const user = this.orch.getConverters()?.get('users').convertToRocketChat(userDescriptor);

		if (!user._id) {
			user._id = Random.id();
		}

		if (!user.createdAt) {
			user.createdAt = new Date();
		}

		switch (user.type) {
			case 'app':
				if (!checkUsernameAvailability(user.username)) {
					throw new Error(`The username "${user.username}" is already being used. Rename or remove the user using it to install this App`);
				}

				Users.insert(user);

				if (options?.avatarUrl) {
					setUserAvatar(user, options.avatarUrl, '', 'local');
				}

				break;

			default:
				throw new Error('Creating normal users is currently not supported');
		}

		return user._id;
	}

	protected async remove(user: IUser & { id: string }, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App's user is being removed: ${appId}`);

		// It's actually not a problem if there is no App user to delete - just means we don't need to do anything more.
		if (!user) {
			return true;
		}

		try {
			deleteUser(user.id);
		} catch (err) {
			throw new Error(`Errors occurred while deleting an app user: ${err}`);
		}

		return true;
	}

	protected async update(user: IUser & { id: string }, fields: Partial<IUser>, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is updating a user`);

		if (!user) {
			throw new Error('User not provided');
		}

		if (!Object.keys(fields).length) {
			return true;
		}

		const { status } = fields;
		delete fields.status;

		await UsersRaw.update({ _id: user.id }, { $set: fields as any });

		if (status) {
			UserPresence.setDefaultStatus(user.id, status);
		}

		return true;
	}

	protected async getActiveUserCount(): Promise<number> {
		return Users.getActiveLocalUserCount();
	}

	protected async getUserUnreadMessageCount(uid: string): Promise<number> {
		return Subscriptions.getBadgeCount(uid);
	}
}
