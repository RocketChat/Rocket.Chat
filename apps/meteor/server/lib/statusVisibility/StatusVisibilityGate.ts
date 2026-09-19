import type { IServiceClass } from '@rocket.chat/core-services';
import { Settings, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('StatusVisibilityGate');

const STATUS_VISIBILITY_SETTING_ID = 'Accounts_StatusVisibility_Enabled';
const STATUS_VISIBILITY_ADMIN_SETTING_ID = 'Accounts_StatusVisibility_Admin_Enabled';
const USER_STATUS_SETTING_ID = 'Accounts_UserStatus_Enabled';

export class StatusVisibilityGate {
	private settingCache = new Map<string, Promise<boolean>>();

	private everyoneHidden = false;

	private adminHidingEnabled?: boolean;

	private restrictedUsers?: Set<IUser['_id']>;

	private pendingSync?: Promise<void>;

	private queuedSync?: Promise<void>;

	watch(service: IServiceClass): void {
		service.onSettingChanged(STATUS_VISIBILITY_SETTING_ID, async ({ setting }) => {
			this.settingCache.set(STATUS_VISIBILITY_SETTING_ID, Promise.resolve(setting.value === true));
		});

		service.onSettingChanged(STATUS_VISIBILITY_ADMIN_SETTING_ID, async ({ setting }) => {
			this.adminHidingEnabled = setting.value === true;
			this.settingCache.set(STATUS_VISIBILITY_ADMIN_SETTING_ID, Promise.resolve(this.adminHidingEnabled));
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

	private async adminHidingAllowed(): Promise<boolean> {
		return this.isSettingEnabled(STATUS_VISIBILITY_ADMIN_SETTING_ID, true);
	}

	private async hidesEveryone(): Promise<boolean> {
		return !(await this.isSettingEnabled(USER_STATUS_SETTING_ID, false));
	}

	private restricted(answer: (users: Set<IUser['_id']>) => boolean): boolean {
		if (this.everyoneHidden) {
			return true;
		}

		if (!this.restrictedUsers) {
			void this.syncRestrictedUsers();
			return true;
		}

		return this.adminHidingEnabled !== false && answer(this.restrictedUsers);
	}

	isActive(): boolean {
		return this.restricted((users) => users.size > 0);
	}

	async ensureActive(): Promise<boolean> {
		if (await this.hidesEveryone()) {
			return true;
		}

		if (!(await this.adminHidingAllowed())) {
			return false;
		}

		return (await this.isSettingEnabled(STATUS_VISIBILITY_SETTING_ID, true)) || this.isActive();
	}

	hasRestrictions(targetId: IUser['_id']): boolean {
		return this.restricted((users) => users.has(targetId));
	}

	syncRestrictedUsers(): Promise<void> {
		if (this.pendingSync) {
			this.queuedSync ??= this.pendingSync.then(() => {
				this.queuedSync = undefined;
				return this.syncRestrictedUsers();
			});

			return this.queuedSync;
		}

		this.pendingSync = Promise.all([StatusVisibility.getRestrictedUsers(), this.hidesEveryone(), this.adminHidingAllowed()])
			.then(([users, everyoneHidden, adminHidingEnabled]) => {
				this.restrictedUsers = new Set(users);
				this.everyoneHidden = everyoneHidden;
				this.adminHidingEnabled = adminHidingEnabled;
			})
			.catch((err) => {
				this.restrictedUsers = undefined;
				logger.error({ msg: 'Failed to sync the status visibility gate, keeping every user restricted', err });
			})
			.finally(() => {
				this.pendingSync = undefined;
			});

		return this.pendingSync;
	}
}

export const statusVisibilityGate = new StatusVisibilityGate();
