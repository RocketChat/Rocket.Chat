import type { IStatusVisibilityService, PresenceScope } from '@rocket.chat/core-services';
import { api, ServiceClassInternal, Settings } from '@rocket.chat/core-services';
import type { IUser, UserPresence } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

const logger = new Logger('StatusVisibility');

const PRESENCE_FIELDS = { username: 1, status: 1, statusText: 1, statusSource: 1, statusExpiresAt: 1 } as const;

const PRESENCE_MODULE = 'unlimited-presence';

export class StatusVisibilityService extends ServiceClassInternal implements IStatusVisibilityService {
	protected name = 'status-visibility';

	private hidingEnabled = false;

	private everyoneHidden = false;

	private hiddenFromByUser = new Map<IUser['_id'], Set<IUser['_id']>>();

	private adminDisabledUsers: ReadonlySet<IUser['_id']> = new Set();

	private lock: Promise<unknown> = Promise.resolve();

	constructor() {
		super();

		this.onSettingChanged('Accounts_StatusVisibility_Enabled', async () => {
			await this.invalidate();
		});

		this.onSettingChanged('Accounts_UserStatus_Enabled', async () => {
			await this.invalidate();
		});

		this.onEvent('license.module', async ({ module }) => {
			if (module === PRESENCE_MODULE) {
				await this.invalidate();
			}
		});
	}

	override async started(): Promise<void> {
		await this.refresh();
	}

	async getHiddenFrom(viewerId: IUser['_id'] | null | undefined): Promise<PresenceScope> {
		if (this.everyoneHidden) {
			return { hideAll: true };
		}

		const perViewer: IUser['_id'][] = [];
		if (this.hidingEnabled && viewerId) {
			for (const [targetId, viewers] of this.hiddenFromByUser) {
				if (targetId !== viewerId && viewers.has(viewerId) && !this.adminDisabledUsers.has(targetId)) {
					perViewer.push(targetId);
				}
			}
		}

		const selfDisabled = Boolean(viewerId && this.adminDisabledUsers.has(viewerId));

		if (!perViewer.length && !selfDisabled) {
			return { hideAll: false, ...(this.adminDisabledUsers.size && { hidden: this.adminDisabledUsers }) };
		}

		const hidden = new Set([...this.adminDisabledUsers, ...perViewer]);

		if (viewerId) {
			hidden.delete(viewerId);
		}

		return { hideAll: false, ...(hidden.size && { hidden }) };
	}

	async isPresenceDisabledFor(targetId: IUser['_id']): Promise<boolean> {
		return this.everyoneHidden || this.adminDisabledUsers.has(targetId);
	}

	async hasRestrictions(targetId: IUser['_id']): Promise<boolean> {
		return this.everyoneHidden || (this.hidingEnabled && this.hiddenFromByUser.has(targetId)) || this.adminDisabledUsers.has(targetId);
	}

	async getRestrictedUsers(): Promise<IUser['_id'][]> {
		return [...new Set([...this.hiddenFromByUser.keys(), ...this.adminDisabledUsers])];
	}

	async refresh(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		const result = this.lock.then(() => this.rebuildHiddenUsers(targets));
		this.lock = result.catch(() => undefined);
		return result;
	}

	private allPresences(): Promise<UserPresence[]> {
		return Users.findUsersNotOffline<UserPresence>({ projection: PRESENCE_FIELDS }).toArray();
	}

	private async rebuildAdminDisabled(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		if (!License.hasModule(PRESENCE_MODULE)) {
			this.adminDisabledUsers = new Set();
			return [];
		}

		const users = await Users.findPresenceDisabledByAdmin<UserPresence>(targets, { projection: PRESENCE_FIELDS }).toArray();
		const disabled = new Set(users.map(({ _id }) => _id));

		if (!targets) {
			this.adminDisabledUsers = disabled;
			return users;
		}

		const next = new Set(this.adminDisabledUsers);
		targets.forEach((uid) => (disabled.has(uid) ? next.add(uid) : next.delete(uid)));
		this.adminDisabledUsers = next;

		return users;
	}

	private async rebuildHiddenUsers(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		const wasHidingEveryone = this.everyoneHidden;
		this.everyoneHidden = (await Settings.get<boolean>('Accounts_UserStatus_Enabled')) === false;
		this.hidingEnabled = (await Settings.get<boolean>('Accounts_StatusVisibility_Enabled')) === true;

		if (this.everyoneHidden) {
			this.hiddenFromByUser.clear();
			this.adminDisabledUsers = new Set();

			return this.allPresences();
		}

		const previous = targets ?? [...new Set([...this.hiddenFromByUser.keys(), ...this.adminDisabledUsers])];

		const disabled = await this.rebuildAdminDisabled(targets);

		if (!this.hidingEnabled) {
			this.hiddenFromByUser.clear();

			if (wasHidingEveryone) {
				return this.allPresences();
			}

			const dropped = previous.filter((uid) => !this.adminDisabledUsers.has(uid));
			const users: UserPresence[] = dropped.length
				? await Users.findPresenceUsersByIds(dropped, { projection: PRESENCE_FIELDS }).toArray()
				: [];

			return [...users, ...disabled];
		}

		const users = await Users.findWithStatusVisibilityConfig(targets).toArray();

		if (targets) {
			targets.forEach((uid) => this.hiddenFromByUser.delete(uid));
		} else {
			this.hiddenFromByUser.clear();
		}

		for (const { _id, settings: userSettings } of users) {
			const viewers = userSettings?.preferences?.statusVisibilityDenied;

			if (viewers?.length) {
				this.hiddenFromByUser.set(_id, new Set(viewers));
			}
		}

		const dropped = previous.filter((uid) => !this.hiddenFromByUser.has(uid) && !this.adminDisabledUsers.has(uid));

		if (dropped.length) {
			users.push(...(await Users.findPresenceUsersByIds(dropped, { projection: PRESENCE_FIELDS }).toArray()));
		}

		const reported = new Set(users.map(({ _id }) => _id));
		const affected = [...users, ...disabled.filter(({ _id }) => !reported.has(_id))];

		if (wasHidingEveryone) {
			return this.allPresences();
		}

		return affected;
	}

	private viewersOf(targets: IUser['_id'][]): IUser['_id'][] {
		const viewers = new Set<IUser['_id']>();

		for (const target of targets) {
			this.hiddenFromByUser.get(target)?.forEach((viewer) => viewers.add(viewer));
		}

		return [...viewers];
	}

	async invalidate(targets?: IUser['_id'][], options?: { allViewers?: boolean }): Promise<UserPresence[]> {
		const scoped = Boolean(targets) && !options?.allViewers;

		if (!scoped) {
			this.broadcastInvalidation(targets, undefined);
			return [];
		}

		const previousViewers = this.viewersOf(targets as IUser['_id'][]);
		const affected = await this.refresh(targets);
		const viewers = [...new Set([...previousViewers, ...this.viewersOf(targets as IUser['_id'][])])];

		this.broadcastInvalidation(targets, viewers);

		return affected;
	}

	private broadcastInvalidation(targets?: IUser['_id'][], viewers?: IUser['_id'][]): void {
		void api
			.broadcast('presence.invalidateVisibility', { targets, viewers })
			.catch((err) => logger.error({ msg: 'Status visibility invalidation failed', err, targets }));
	}
}
