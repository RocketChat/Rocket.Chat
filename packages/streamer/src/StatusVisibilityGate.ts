import type { IServiceClass } from '@rocket.chat/core-services';
import { Settings, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('StatusVisibilityGate');

export class StatusVisibilityGate {
	private settingCache = new Map<string, Promise<boolean>>();

	private everyoneHidden = false;

	private adminHidingEnabled?: boolean;

	private restrictedUsers?: Set<IUser['_id']>;

	private pendingSync?: Promise<void>;

	private queuedSync?: Promise<void>;

	watch(service: IServiceClass): void {
		service.onSettingChanged('Accounts_StatusVisibility_Enabled', async ({ setting }) => {
			this.settingCache.set('Accounts_StatusVisibility_Enabled', Promise.resolve(setting.value === true));
		});

		service.onSettingChanged('Accounts_StatusVisibility_Admin_Enabled', async ({ setting }) => {
			this.adminHidingEnabled = setting.value === true;
			this.settingCache.set('Accounts_StatusVisibility_Admin_Enabled', Promise.resolve(this.adminHidingEnabled));
		});

		service.onSettingChanged('Accounts_UserStatus_Enabled', async ({ setting }) => {
			this.everyoneHidden = setting.value === false;
			this.settingCache.set('Accounts_UserStatus_Enabled', Promise.resolve(!this.everyoneHidden));
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

	private adminHidingAllowed(): Promise<boolean> {
		return this.isSettingEnabled('Accounts_StatusVisibility_Admin_Enabled', true);
	}

	private async hidesEveryone(): Promise<boolean> {
		return !(await this.isSettingEnabled('Accounts_UserStatus_Enabled', false));
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

		return (await this.isSettingEnabled('Accounts_StatusVisibility_Enabled', true)) || this.isActive();
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
