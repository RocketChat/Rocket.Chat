import { Settings, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

export const STATUS_VISIBILITY_SETTING_ID = 'Accounts_StatusVisibility_Enabled';

export class StatusVisibilityGate {
	private enabled = false;

	async start(): Promise<void> {
		this.enabled = (await Settings.get<boolean>(STATUS_VISIBILITY_SETTING_ID)) === true;
	}

	setEnabled(value: unknown): void {
		this.enabled = value === true;
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	async hasRestrictions(uid: IUser['_id']): Promise<boolean> {
		return StatusVisibility.hasRestrictions(uid).catch(() => true);
	}
}
