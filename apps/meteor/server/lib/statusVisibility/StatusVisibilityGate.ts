import type { IServiceClass } from '@rocket.chat/core-services';
import { Settings, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

export const STATUS_VISIBILITY_SETTING_ID = 'Accounts_StatusVisibility_Enabled';
const USER_STATUS_SETTING_ID = 'Accounts_UserStatus_Enabled';

export class StatusVisibilityGate {
	private settingCache = new Map<string, Promise<boolean>>();

	private everyoneHidden = false;

	private restrictedUsers?: Set<IUser['_id']>;

	private pendingSync?: Promise<void>;

	watch(service: IServiceClass): void {
		service.onSettingChanged(STATUS_VISIBILITY_SETTING_ID, async ({ setting }) => {
			this.settingCache.set(STATUS_VISIBILITY_SETTING_ID, Promise.resolve(setting.value === true));
		});

		service.onSettingChanged(USER_STATUS_SETTING_ID, async ({ setting }) => {
			this.everyoneHidden = setting.value === false;
			this.settingCache.set(USER_STATUS_SETTING_ID, Promise.resolve(!this.everyoneHidden));
		});
	}

	private isSettingEnabled(id: string, onFailure: boolean): Promise<boolean> {
		const cached = this.settingCache.get(id);

		if (cached) {
			return cached;
		}

		const lookup = Settings.get<boolean>(id)
			.then((value) => value !== false)
			.catch(() => {
				this.settingCache.delete(id);
				return onFailure;
			});

		this.settingCache.set(id, lookup);

		return lookup;
	}

	async hidesEveryone(): Promise<boolean> {
		return !(await this.isSettingEnabled(USER_STATUS_SETTING_ID, true));
	}

	isActive(): boolean {
		if (this.everyoneHidden) {
			return true;
		}

		if (!this.restrictedUsers) {
			void this.syncRestrictedUsers();
			return true;
		}

		return this.restrictedUsers.size > 0;
	}

	async ensureActive(): Promise<boolean> {
		return (await this.hidesEveryone()) || (await this.isSettingEnabled(STATUS_VISIBILITY_SETTING_ID, true)) || this.isActive();
	}

	hasRestrictions(targetId: IUser['_id']): boolean {
		if (this.everyoneHidden) {
			return true;
		}

		if (!this.restrictedUsers) {
			void this.syncRestrictedUsers();
			return true;
		}

		return this.restrictedUsers.has(targetId);
	}

	syncRestrictedUsers(): Promise<void> {
		if (!this.pendingSync) {
			this.pendingSync = Promise.all([StatusVisibility.getRestrictedUsers(), this.hidesEveryone()])
				.then(([users, everyoneHidden]) => {
					this.restrictedUsers = new Set(users);
					this.everyoneHidden = everyoneHidden;
				})
				.catch(() => undefined)
				.finally(() => {
					this.pendingSync = undefined;
				});
		}

		return this.pendingSync;
	}
}

export const statusVisibilityGate = new StatusVisibilityGate();
