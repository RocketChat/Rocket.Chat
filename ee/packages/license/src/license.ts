import { Emitter } from '@rocket.chat/emitter';

import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3, LicenseLimitKind } from './definition/ILicenseV3';
import type { BehaviorWithContext } from './definition/LicenseBehavior';
import type { LicenseModule } from './definition/LicenseModule';
import type { LicenseValidationOptions } from './definition/LicenseValidationOptions';
import type { LimitContext } from './definition/LimitContext';
import type { LicenseEvents } from './definition/events';
import { DuplicatedLicenseError } from './errors/DuplicatedLicenseError';
import { InvalidLicenseError } from './errors/InvalidLicenseError';
import { NotReadyForValidation } from './errors/NotReadyForValidation';
import { behaviorTriggered, licenseInvalidated, licenseValidated } from './events/emitter';
import { logger } from './logger';
import { getModules, invalidateAll, replaceModules } from './modules';
import { applyPendingLicense, clearPendingLicense, hasPendingLicense, isPendingLicense, setPendingLicense } from './pendingLicense';
import { showLicense } from './showLicense';
import { replaceTags } from './tags';
import { decrypt } from './token';
import { convertToV3 } from './v2/convertToV3';
import { getCurrentValueForLicenseLimit } from './validation/getCurrentValueForLicenseLimit';
import { getModulesToDisable } from './validation/getModulesToDisable';
import { isBehaviorsInResult } from './validation/isBehaviorsInResult';
import { isReadyForValidation } from './validation/isReadyForValidation';
import { runValidation } from './validation/runValidation';
import { validateFormat } from './validation/validateFormat';

const globalLimitKinds: LicenseLimitKind[] = ['activeUsers', 'guestUsers', 'privateApps', 'marketplaceApps', 'monthlyActiveContacts'];

export class LicenseManager extends Emitter<LicenseEvents> {
	dataCounters = new Map<LicenseLimitKind, (context?: LimitContext<LicenseLimitKind>) => Promise<number>>();

	pendingLicense = '';

	modules = new Set<LicenseModule>();

	private workspaceUrl: string | undefined;

	private _license: ILicenseV3 | undefined;

	private _unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;

	private _valid: boolean | undefined;

	private _inFairPolicy = false;

	private _lockedLicense: string | undefined;

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
		return this._inFairPolicy;
	}

	public async setWorkspaceUrl(url: string) {
		this.workspaceUrl = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

		if (hasPendingLicense.call(this)) {
			await applyPendingLicense.call(this);
		}
	}

	public getWorkspaceUrl() {
		return this.workspaceUrl;
	}

	public async revalidateLicense(options: Omit<LicenseValidationOptions, 'isNewLicense'> = {}): Promise<void> {
		if (!this.hasValidLicense()) {
			return;
		}

		try {
			await this.validateLicense({ ...options, isNewLicense: false });
		} finally {
			if (!this.hasValidLicense()) {
				this.invalidateLicense();
			}
		}
	}

	private clearLicenseData(): void {
		this._license = undefined;
		this._unmodifiedLicense = undefined;
		this._inFairPolicy = false;
		this._valid = false;
		this._lockedLicense = undefined;
		clearPendingLicense.call(this);
	}

	private invalidateLicense(): void {
		licenseInvalidated.call(this);
		invalidateAll.call(this);
	}

	private async setLicenseV3(newLicense: ILicenseV3, encryptedLicense: string, originalLicense?: ILicenseV2 | ILicenseV3): Promise<void> {
		const hadValidLicense = this.hasValidLicense();
		this.clearLicenseData();

		try {
			this._unmodifiedLicense = originalLicense || newLicense;
			this._license = newLicense;

			await this.validateLicense({ isNewLicense: encryptedLicense !== this._lockedLicense });
			this._lockedLicense = encryptedLicense;

			if (this.valid) {
				licenseValidated.call(this);
				showLicense.call(this, this._license, this._valid);
			}
		} finally {
			if (hadValidLicense && !this.hasValidLicense()) {
				this.invalidateLicense();
			}
		}
	}

	private async setLicenseV2(newLicense: ILicenseV2, encryptedLicense: string): Promise<void> {
		return this.setLicenseV3(convertToV3(newLicense), encryptedLicense, newLicense);
	}

	private isLicenseDuplicated(encryptedLicense: string): boolean {
		return Boolean(this._lockedLicense && this._lockedLicense === encryptedLicense);
	}

	private async validateLicense(options: LicenseValidationOptions = {}): Promise<void> {
		if (!this._license) {
			throw new InvalidLicenseError();
		}

		if (!isReadyForValidation.call(this)) {
			throw new NotReadyForValidation();
		}

		const validationResult = await runValidation.call(this, this._license, options);
		this.processValidationResult(validationResult, options);
		if (!options.isNewLicense) {
			this.triggerBehaviorEvents(validationResult);
		}
	}

	public async setLicense(encryptedLicense: string): Promise<boolean> {
		if (!(await validateFormat(encryptedLicense))) {
			throw new InvalidLicenseError();
		}

		if (this.isLicenseDuplicated(encryptedLicense)) {
			// If there is a pending license but the user is trying to revert to the license that is currently active
			if (hasPendingLicense.call(this) && !isPendingLicense.call(this, encryptedLicense)) {
				// simply remove the pending license
				clearPendingLicense.call(this);
				throw new Error('Invalid license 1');
			}

			throw new DuplicatedLicenseError();
		}

		if (!isReadyForValidation.call(this)) {
			// If we can't validate the license data yet, but is a valid license string, store it to validate when we can
			setPendingLicense.call(this, encryptedLicense);
			throw new NotReadyForValidation();
		}

		logger.info('New Enterprise License');
		try {
			const decrypted = JSON.parse(await decrypt(encryptedLicense));

			logger.debug({ msg: 'license', decrypted });

			if (!encryptedLicense.startsWith('RCV3_')) {
				await this.setLicenseV2(decrypted, encryptedLicense);
				return true;
			}
			await this.setLicenseV3(decrypted, encryptedLicense);

			return true;
		} catch (e) {
			logger.error('Invalid license');

			logger.error({ msg: 'Invalid raw license', encryptedLicense, e });

			throw new InvalidLicenseError();
		}
	}

	private processValidationResult(result: BehaviorWithContext[], options: LicenseValidationOptions): void {
		if (!this._license || isBehaviorsInResult(result, ['invalidate_license', 'prevent_installation'])) {
			this._valid = false;
			return;
		}

		const shouldLogModules = !this._valid || options.isNewLicense;

		this._valid = true;
		if (isBehaviorsInResult(result, ['start_fair_policy'])) {
			this._inFairPolicy = true;
		}

		if (this._license.information.tags) {
			replaceTags(this._license.information.tags);
		}

		const disabledModules = getModulesToDisable(result);
		const modulesToEnable = this._license.grantedModules.filter(({ module }) => !disabledModules.includes(module));

		const modulesChanged = replaceModules.call(
			this,
			modulesToEnable.map(({ module }) => module),
		);

		if (shouldLogModules || modulesChanged) {
			logger.log({ msg: 'License validated', modules: modulesToEnable });
		}
	}

	private triggerBehaviorEvents(validationResult: BehaviorWithContext[]): void {
		for (const { ...options } of validationResult) {
			behaviorTriggered.call(this, { ...options });
		}
	}

	public hasValidLicense(): boolean {
		return Boolean(this.getLicense());
	}

	public getLicense(): ILicenseV3 | undefined {
		if (this._valid && this._license) {
			return this._license;
		}
	}

	public async shouldPreventAction<T extends LicenseLimitKind>(
		action: T,
		context: Partial<LimitContext<T>> = {},
		newCount = 1,
		{ suppressLog }: Pick<LicenseValidationOptions, 'suppressLog'> = {},
	): Promise<boolean> {
		const license = this.getLicense();
		if (!license) {
			return false;
		}

		const options: LicenseValidationOptions = {
			behaviors: ['prevent_action'],
			isNewLicense: false,
			suppressLog: !!suppressLog,
			context: {
				[action]: {
					extraCount: newCount,
					...context,
				},
			},
		};

		const validationResult = await runValidation.call(this, license, options);
		this.triggerBehaviorEvents(validationResult);

		return isBehaviorsInResult(validationResult, ['prevent_action']);
	}

	public async getInfo(loadCurrentValues = false): Promise<{
		license: ILicenseV3 | undefined;
		activeModules: LicenseModule[];
		limits: Record<LicenseLimitKind, { value?: number; max: number }>;
		inFairPolicy: boolean;
	}> {
		const activeModules = getModules.call(this);
		const license = this.getLicense();

		// Get all limits present in the license and their current value
		const limits = (
			(license &&
				(await Promise.all(
					globalLimitKinds
						.map((limitKey) => ({
							limitKey,
							max: Math.max(-1, Math.min(...Array.from(license.limits[limitKey as LicenseLimitKind] || [])?.map(({ max }) => max))),
						}))
						.filter(({ max }) => max >= 0 && max < Infinity)
						.map(async ({ max, limitKey }) => {
							return {
								[limitKey as LicenseLimitKind]: {
									...(loadCurrentValues ? { value: await getCurrentValueForLicenseLimit.call(this, limitKey as LicenseLimitKind) } : {}),
									max,
								},
							};
						}),
				))) ||
			[]
		).reduce((prev, curr) => ({ ...prev, ...curr }), {});

		return {
			license,
			activeModules,
			limits: limits as Record<LicenseLimitKind, { max: number; value: number }>,
			inFairPolicy: this.inFairPolicy,
		};
	}
}
