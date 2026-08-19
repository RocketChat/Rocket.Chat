import type { IStatusVisibilityService } from '@rocket.chat/core-services';
import { api, ServiceClassInternal, Settings } from '@rocket.chat/core-services';
import type { IUser, UserPresence } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

const logger = new Logger('StatusVisibility');

const PRESENCE_FIELDS = { username: 1, status: 1, statusText: 1, statusSource: 1, statusExpiresAt: 1 } as const;

export class StatusVisibilityService extends ServiceClassInternal implements IStatusVisibilityService {
	protected name = 'status-visibility';

	private enabled = false;

	private hiddenFromByUser = new Map<IUser['_id'], Set<IUser['_id']>>();

	private lock: Promise<unknown> = Promise.resolve();

	constructor() {
		super();

		this.onSettingChanged('Accounts_StatusVisibility_Enabled', async () => {
			await this.invalidate();
		});
	}

	override async started(): Promise<void> {
		await this.refresh();
	}

	async getHiddenFrom(viewerId: IUser['_id'] | null | undefined): Promise<IUser['_id'][]> {
		if (!this.enabled || !viewerId) {
			return [];
		}

		return [...this.hiddenFromByUser]
			.filter(([targetId, viewers]) => targetId !== viewerId && viewers.has(viewerId))
			.map(([targetId]) => targetId);
	}

	async hasRestrictions(targetId: IUser['_id']): Promise<boolean> {
		return this.enabled && this.hiddenFromByUser.has(targetId);
	}

	async getRestrictedUsers(): Promise<IUser['_id'][]> {
		return [...this.hiddenFromByUser.keys()];
	}

	async refresh(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		const result = this.lock.then(() => this.rebuildHiddenUsers(targets));
		this.lock = result.catch(() => undefined);
		return result;
	}

	private async rebuildHiddenUsers(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		this.enabled = (await Settings.get<boolean>('Accounts_StatusVisibility_Enabled')) === true;

		if (!this.enabled) {
			const previous = [...this.hiddenFromByUser.keys()];
			this.hiddenFromByUser.clear();
			return previous.length ? Users.findPresenceUsersByIds(previous, { projection: PRESENCE_FIELDS }).toArray() : [];
		}

		const previous = targets ?? [...this.hiddenFromByUser.keys()];

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

		const dropped = previous.filter((uid) => !this.hiddenFromByUser.has(uid));

		if (dropped.length) {
			users.push(...(await Users.findPresenceUsersByIds(dropped, { projection: PRESENCE_FIELDS }).toArray()));
		}

		return users;
	}

	private viewersOf(targets: IUser['_id'][]): IUser['_id'][] {
		const viewers = new Set<IUser['_id']>();

		for (const target of targets) {
			this.hiddenFromByUser.get(target)?.forEach((viewer) => viewers.add(viewer));
		}

		return [...viewers];
	}

	async invalidate(targets?: IUser['_id'][]): Promise<UserPresence[]> {
		const previousViewers = targets && this.viewersOf(targets);
		const affected = await this.refresh(targets);
		const viewers = previousViewers && [...new Set([...previousViewers, ...this.viewersOf(targets)])];

		void api
			.broadcast('presence.invalidateVisibility', { targets, viewers })
			.catch((err) => logger.error({ msg: 'Status visibility invalidation failed', err, targets }));

		return affected;
	}
}
