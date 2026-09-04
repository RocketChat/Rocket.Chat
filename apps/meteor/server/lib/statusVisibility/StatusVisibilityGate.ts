import type { IServiceClass } from '@rocket.chat/core-services';
import { Settings, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

export const STATUS_VISIBILITY_SETTING_ID = 'Accounts_StatusVisibility_Enabled';
const USER_STATUS_SETTING_ID = 'Accounts_UserStatus_Enabled';

export class StatusVisibilityGate {
	private enabledLookup?: Promise<boolean>;

	private disabledLookup?: Promise<boolean>;

	private everyoneHidden = false;

	private restricted?: Set<IUser['_id']>;

	private pendingSync?: Promise<void>;

	watch(service: IServiceClass): void {
		service.onSettingChanged(STATUS_VISIBILITY_SETTING_ID, async ({ setting }) => {
			this.enabledLookup = Promise.resolve(setting.value === true);
		});

		service.onSettingChanged(USER_STATUS_SETTING_ID, async ({ setting }) => {
			this.everyoneHidden = setting.value === false;
			this.disabledLookup = Promise.resolve(this.everyoneHidden);
		});
	}

	hidesEveryone(): Promise<boolean> {
		if (!this.disabledLookup) {
			this.disabledLookup = Settings.get<boolean>(USER_STATUS_SETTING_ID)
				.then((value) => value === false)
				.catch(() => {
					this.disabledLookup = undefined;
					return false;
				});
		}

		return this.disabledLookup;
	}

	private ensureSettingEnabled(): Promise<boolean> {
		if (!this.enabledLookup) {
			this.enabledLookup = Settings.get<boolean>(STATUS_VISIBILITY_SETTING_ID)
				.then((value) => value === true)
				.catch(() => {
					this.enabledLookup = undefined;
					return true;
				});
		}

		return this.enabledLookup;
	}

	isActive(): boolean {
		if (this.everyoneHidden) {
			return true;
		}

		if (!this.restricted) {
			void this.syncRestrictedUsers();
			return true;
		}

		return this.restricted.size > 0;
	}

	async ensureActive(): Promise<boolean> {
		return (await this.hidesEveryone()) || (await this.ensureSettingEnabled()) || this.isActive();
	}

	hasRestrictions(targetId: IUser['_id']): boolean {
		if (this.everyoneHidden) {
			return true;
		}

		if (!this.restricted) {
			void this.syncRestrictedUsers();
			return true;
		}

		return this.restricted.has(targetId);
	}

	syncRestrictedUsers(): Promise<void> {
		if (!this.pendingSync) {
			this.pendingSync = Promise.all([StatusVisibility.getRestrictedUsers(), this.hidesEveryone()])
				.then(([users, everyoneHidden]) => {
					this.restricted = new Set(users);
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
