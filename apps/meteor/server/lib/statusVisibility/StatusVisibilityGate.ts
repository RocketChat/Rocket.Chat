import type { IServiceClass } from '@rocket.chat/core-services';
import { Settings } from '@rocket.chat/core-services';

export const STATUS_VISIBILITY_SETTING_ID = 'Accounts_StatusVisibility_Enabled';

export class StatusVisibilityGate {
	private enabledLookup?: Promise<boolean>;

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
}

export const statusVisibilityGate = new StatusVisibilityGate();
