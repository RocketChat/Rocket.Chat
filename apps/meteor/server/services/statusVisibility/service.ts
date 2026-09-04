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

	private enabled = false;

	private presenceDisabled = false;

	private hiddenFromByUser = new Map<IUser['_id'], Set<IUser['_id']>>();

	private adminDisabled: ReadonlySet<IUser['_id']> = new Set();

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

	async getPresenceScope(viewerId: IUser['_id'] | null | undefined): Promise<PresenceScope> {
		if (this.presenceDisabled) {
			return { hideAll: true };
		}

		const perViewer: IUser['_id'][] = [];

		if (this.enabled && viewerId) {
			for (const [targetId, viewers] of this.hiddenFromByUser) {
				if (targetId !== viewerId && viewers.has(viewerId) && !this.adminDisabled.has(targetId)) {
					perViewer.push(targetId);
				}
			}
		}

		if (!perViewer.length) {
			return { hideAll: false, ...(this.adminDisabled.size && { hidden: this.adminDisabled }) };
		}

		return { hideAll: false, hidden: new Set([...this.adminDisabled, ...perViewer]) };
	}

	async isPresenceDisabledFor(targetId: IUser['_id']): Promise<boolean> {
		return this.presenceDisabled || this.adminDisabled.has(targetId);
	}

	async hasRestrictions(targetId: IUser['_id']): Promise<boolean> {
		return this.presenceDisabled || (this.enabled && this.hiddenFromByUser.has(targetId)) || this.adminDisabled.has(targetId);
	}

	async getRestrictedUsers(): Promise<IUser['_id'][]> {
		return [...new Set([...this.hiddenFromByUser.keys(), ...this.adminDisabled])];
	}

	async refresh(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		const result = this.lock.then(() => this.rebuildHiddenUsers(targets));
		this.lock = result.catch(() => undefined);
		return result;
	}

	private async rebuildAdminDisabled(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		if (!License.hasModule(PRESENCE_MODULE)) {
			this.adminDisabled = new Set();
			return [];
		}

		const users = await Users.findPresenceDisabledByAdmin<UserPresence>(targets, { projection: PRESENCE_FIELDS }).toArray();
		const disabled = new Set(users.map(({ _id }) => _id));

		if (!targets) {
			this.adminDisabled = disabled;
			return users;
		}

		const next = new Set(this.adminDisabled);
		targets.forEach((uid) => (disabled.has(uid) ? next.add(uid) : next.delete(uid)));
		this.adminDisabled = next;

		return users;
	}

	private async rebuildHiddenUsers(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		const wasDisabled = this.presenceDisabled;
		this.presenceDisabled = (await Settings.get<boolean>('Accounts_UserStatus_Enabled')) === false;
		this.enabled = (await Settings.get<boolean>('Accounts_StatusVisibility_Enabled')) === true;

		if (this.presenceDisabled) {
			this.hiddenFromByUser.clear();
			this.adminDisabled = new Set();

			return Users.findUsersNotOffline<UserPresence>({ projection: PRESENCE_FIELDS }).toArray();
		}

		const previous = targets ?? [...new Set([...this.hiddenFromByUser.keys(), ...this.adminDisabled])];

		const disabled = await this.rebuildAdminDisabled(targets);

		if (!this.enabled) {
			this.hiddenFromByUser.clear();

			if (wasDisabled) {
				return Users.findUsersNotOffline<UserPresence>({ projection: PRESENCE_FIELDS }).toArray();
			}

			const dropped = previous.filter((uid) => !this.adminDisabled.has(uid));
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

		const dropped = previous.filter((uid) => !this.hiddenFromByUser.has(uid) && !this.adminDisabled.has(uid));

		if (dropped.length) {
			users.push(...(await Users.findPresenceUsersByIds(dropped, { projection: PRESENCE_FIELDS }).toArray()));
		}

		const reported = new Set(users.map(({ _id }) => _id));
		const affected = [...users, ...disabled.filter(({ _id }) => !reported.has(_id))];

		if (wasDisabled) {
			return Users.findUsersNotOffline<UserPresence>({ projection: PRESENCE_FIELDS }).toArray();
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
