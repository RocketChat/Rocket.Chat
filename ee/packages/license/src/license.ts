import decrypt from './decrypt';
import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3, LicenseLimitKind } from './definition/ILicenseV3';
import type { BehaviorWithContext } from './definition/LicenseBehavior';
import type { LimitContext } from './definition/LimitContext';
import { licenseRemoved, licenseValidated } from './events/emitter';
import { logger } from './logger';
import { invalidateAll, replaceModules } from './modules';
import { clearPendingLicense, hasPendingLicense, isPendingLicense, setPendingLicense } from './pendingLicense';
import { showLicense } from './showLicense';
import { replaceTags } from './tags';
import { convertToV3 } from './v2/convertToV3';
import { getCurrentValueForLicenseLimit } from './validation/getCurrentValueForLicenseLimit';
import { getModulesToDisable } from './validation/getModulesToDisable';
import { isBehaviorsInResult } from './validation/isBehaviorsInResult';
import { isReadyForValidation } from './validation/isReadyForValidation';
import { runValidation } from './validation/runValidation';
import { validateFormat } from './validation/validateFormat';

let licenseManager: LicenseManager | undefined;

export class LicenseManager {
	private _license: ILicenseV3 | undefined;

	private _unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;

	private _valid: boolean | undefined;

	private _inFairPolicy: boolean | undefined;

	private _lockedLicense: string | undefined;

	public static getLicenseManager(): LicenseManager {
		if (!licenseManager) {
			licenseManager = new LicenseManager();
		}

		return licenseManager;
	}

	public static async setLicense(encryptedLicense: string): Promise<boolean> {
		return this.getLicenseManager().setLicense(encryptedLicense);
	}

	public static hasValidLicense(): boolean {
		return this.getLicenseManager().hasValidLicense();
	}

	public static getLicense(): ILicenseV3 | undefined {
		return this.getLicenseManager().getLicense();
	}

	public static async shouldPreventAction<T extends LicenseLimitKind>(
		action: T,
		context?: Partial<LimitContext<T>>,
		newCount = 1,
	): Promise<boolean> {
		return this.getLicenseManager().shouldPreventAction(action, context, newCount);
	}

	public get license(): ILicenseV3 | undefined {
		return this._license;
	}

	public get unmodifiedLicense(): ILicenseV2 | ILicenseV3 | undefined {
		return this._unmodifiedLicense;
	}

	public get valid(): boolean | undefined {
		return this._valid;
	}

	public get inFairPolicy(): boolean {
		return Boolean(this._inFairPolicy);
	}

	private clearLicenseData(): void {
		this._license = undefined;
		this._unmodifiedLicense = undefined;
		this._inFairPolicy = undefined;
		this._valid = false;
		this._lockedLicense = undefined;
		clearPendingLicense();
	}

	private async setLicenseV3(newLicense: ILicenseV3, encryptedLicense: string, originalLicense?: ILicenseV2 | ILicenseV3): Promise<void> {
		const hadValidLicense = this.hasValidLicense();
		this.clearLicenseData();

		try {
			this._unmodifiedLicense = originalLicense || newLicense;
			this._license = newLicense;

			await this.validateLicense();
			this._lockedLicense = encryptedLicense;
		} finally {
			if (hadValidLicense && !this.hasValidLicense()) {
				licenseRemoved();
				invalidateAll();
			}
		}
	}

	private async setLicenseV2(newLicense: ILicenseV2, encryptedLicense: string): Promise<void> {
		return this.setLicenseV3(convertToV3(newLicense), encryptedLicense, newLicense);
	}

	private isLicenseDuplicate(encryptedLicense: string): boolean {
		return Boolean(this._lockedLicense && this._lockedLicense === encryptedLicense);
	}

	private processValidationResult(result: BehaviorWithContext[]): void {
		if (!this._license || isBehaviorsInResult(result, ['invalidate_license', 'prevent_installation'])) {
			return;
		}

		this._valid = true;
		this._inFairPolicy = isBehaviorsInResult(result, ['start_fair_policy']);

		if (this._license.information.tags) {
			replaceTags(this._license.information.tags);
		}

		const disabledModules = getModulesToDisable(result);
		const modulesToEnable = this._license.grantedModules.filter(({ module }) => !disabledModules.includes(module));

		replaceModules(modulesToEnable.map(({ module }) => module));
		logger.log({ msg: 'License validated', modules: modulesToEnable });

		licenseValidated();
		showLicense(this._license, this._valid);
	}

	private async validateLicense(): Promise<void> {
		if (!this._license || !isReadyForValidation()) {
			return;
		}

		// #TODO: Only include 'prevent_installation' here if this is actually the initial installation of the license
		const validationResult = await runValidation(this._license, [
			'invalidate_license',
			'prevent_installation',
			'start_fair_policy',
			'disable_modules',
		]);
		this.processValidationResult(validationResult);
	}

	public async setLicense(encryptedLicense: string): Promise<boolean> {
		if (!encryptedLicense || String(encryptedLicense).trim() === '') {
			return false;
		}

		if (this.isLicenseDuplicate(encryptedLicense)) {
			// If there is a pending license but the user is trying to revert to the license that is currently active
			if (hasPendingLicense() && !isPendingLicense(encryptedLicense)) {
				// simply remove the pending license
				clearPendingLicense();
				return true;
			}

			return false;
		}

		if (!isReadyForValidation()) {
			// If we can't validate the license data yet, but is a valid license string, store it to validate when we can
			if (validateFormat(encryptedLicense)) {
				setPendingLicense(encryptedLicense);
				return true;
			}

			return false;
		}

		logger.info('New Enterprise License');
		try {
			const decrypted = decrypt(encryptedLicense);
			if (!decrypted) {
				return false;
			}

			if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
				logger.debug({ msg: 'license', decrypted });
			}

			encryptedLicense.startsWith('RCV3_')
				? await this.setLicenseV3(JSON.parse(decrypted), encryptedLicense)
				: await this.setLicenseV2(JSON.parse(decrypted), encryptedLicense);

			return true;
		} catch (e) {
			logger.error('Invalid license');
			if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
				logger.error({ msg: 'Invalid raw license', encryptedLicense, e });
			}
			return false;
		}
	}

	public hasValidLicense(): boolean {
		return Boolean(this._license && this._valid);
	}

	public getLicense(): ILicenseV3 | undefined {
		if (this._valid && this._license) {
			return this._license;
		}
	}

	public async shouldPreventAction<T extends LicenseLimitKind>(
		action: T,
		context?: Partial<LimitContext<T>>,
		newCount = 1,
	): Promise<boolean> {
		const license = this.getLicense();
		if (!license) {
			return false;
		}

		const currentValue = (await getCurrentValueForLicenseLimit(action, context)) + newCount;
		return Boolean(
			license.limits[action]
				?.filter(({ behavior, max }) => behavior === 'prevent_action' && max >= 0)
				.some(({ max }) => max < currentValue),
		);
	}
}
