import type { IServiceClass } from '@rocket.chat/core-services';
import { Settings, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

export const STATUS_VISIBILITY_SETTING_ID = 'Accounts_StatusVisibility_Enabled';

export class StatusVisibilityGate {
	private enabledLookup?: Promise<boolean>;

	private restricted?: Set<IUser['_id']>;

	private pendingSync?: Promise<void>;

	watch(service: IServiceClass): void {
		service.onSettingChanged(STATUS_VISIBILITY_SETTING_ID, async ({ setting }) => {
			this.enabledLookup = Promise.resolve(setting.value === true);
		});
	}

	ensureEnabled(): Promise<boolean> {
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

	hasRestrictions(targetId: IUser['_id']): boolean {
		if (!this.restricted) {
			void this.syncRestrictedUsers();
			return true;
		}

		return this.restricted.has(targetId);
	}

	syncRestrictedUsers(): Promise<void> {
		if (!this.pendingSync) {
			this.pendingSync = StatusVisibility.getRestrictedUsers()
				.then((users) => {
					this.restricted = new Set(users);
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
