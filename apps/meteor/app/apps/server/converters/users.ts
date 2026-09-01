import type { IAppServerOrchestrator, IAppUsersConverter, IAppsUser } from '@rocket.chat/apps';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import * as z from 'zod';

import { UserCodec } from './codecs';

export class AppUsersConverter implements IAppUsersConverter {
	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(userId: IUser['_id']): Promise<IAppsUser | undefined> {
		const user = await Users.findOneById(userId);

		return this.convertToApp(user);
	}

	async convertByUsername(username: IUser['username']): Promise<IAppsUser | undefined> {
		if (!username) {
			return undefined;
		}

		const user = await Users.findOneByUsername(username);

		return this.convertToApp(user);
	}

	convertToApp(user: undefined | null): undefined;

	convertToApp(user: IUser): IAppsUser;

	convertToApp(user: IUser | undefined | null): IAppsUser | undefined;

	convertToApp(user: IUser | undefined | null): IAppsUser | undefined {
		if (!user) {
			return undefined;
		}

		return z.decode(UserCodec, user);
	}

	convertToRocketChat(user: undefined | null): undefined;

	convertToRocketChat(user: IAppsUser): IUser;

	convertToRocketChat(user: IAppsUser | undefined | null): IUser | undefined;

	convertToRocketChat(user: IAppsUser | undefined | null): IUser | undefined {
		if (!user) {
			return undefined;
		}

		return z.encode(UserCodec, user);
	}
}
