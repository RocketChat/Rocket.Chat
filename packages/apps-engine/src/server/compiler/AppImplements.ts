import { AppInterface } from '../../definition/metadata/AppInterface';
import { Utilities } from '../misc/Utilities';

export class AppImplements {
	private implemented: Record<AppInterface, boolean>;

	constructor() {
		this.implemented = {} as Record<AppInterface, boolean>;

		Object.keys(AppInterface).forEach((int: AppInterface) => {
			this.implemented[int] = false;
		});
	}

	public setImplements(int: AppInterface): void {
		if (int in AppInterface) {
			this.implemented[int] = true;
		}
	}

	public doesImplement(int: AppInterface): boolean {
		return this.implemented[int];
	}

	public getValues(): Record<AppInterface, boolean> {
		return Utilities.deepCloneAndFreeze(this.implemented);
	}

	public toJSON(): Record<AppInterface, boolean> {
		return this.getValues();
	}
}
