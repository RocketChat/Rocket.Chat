import { Emitter } from '@rocket.chat/emitter';

import type { ILicenseV2 } from './definition/ILicenseV2';
import type { ILicenseV3, LicenseLimitKind } from './definition/ILicenseV3';
import type { BehaviorWithContext, LicenseBehavior } from './definition/LicenseBehavior';
import type { LicenseModule } from './definition/LicenseModule';
import type { LimitContext } from './definition/LimitContext';
import { DuplicatedLicenseError } from './errors/DuplicatedLicenseError';
import { InvalidLicenseError } from './errors/InvalidLicenseError';
import { NotReadyForValidation } from './errors/NotReadyForValidation';
import { licenseInvalidated, licenseValidated, limitReached } from './events/emitter';
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

const invalidLicenseBehaviors: LicenseBehavior[] = ['invalidate_license', 'prevent_installation'];
const generalValidationBehaviors: LicenseBehavior[] = ['start_fair_policy', 'disable_modules'];
const behaviorsWithLimitEvents = ['invalidate_license', 'start_fair_policy', 'disable_modules', 'custom', 'prevent_action'] as const;
const globalLimitKinds: LicenseLimitKind[] = ['activeUsers', 'guestUsers', 'privateApps', 'marketplaceApps', 'monthlyActiveContacts'];

export class LicenseManager extends Emitter<
	Record<`limitReached:${Exclude<LicenseLimitKind, 'roomsPerGuest'>}:${Exclude<LicenseBehavior, 'prevent_installation'>}`, undefined> &
		Record<`${'invalid' | 'valid'}:${LicenseModule}`, undefined> & {
			validate: undefined;
			invalidate: undefined;
			module: { module: LicenseModule; valid: boolean };
		}
> {
	dataCounters = new Map<LicenseLimitKind, (context?: LimitContext<LicenseLimitKind>) => Promise<number>>();

	countersCache = new Map<LicenseLimitKind, number>();

	pendingLicense = '';

	modules = new Set<LicenseModule>();

	private workspaceUrl: string | undefined;

	private _license: ILicenseV3 | undefined;

	private _unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;

	private _valid: boolean | undefined;

	private _inFairPolicy: boolean | undefined;

	private _lockedLicense: string | undefined;

	private _accessedLimits = new Set<Exclude<LicenseLimitKind, 'roomsPerGuest'>>();

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

	public async setWorkspaceUrl(url: string) {
		this.workspaceUrl = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

		if (hasPendingLicense.call(this)) {
			await applyPendingLicense.call(this);
		}
	}

	public getWorkspaceUrl() {
		return this.workspaceUrl;
	}

	public async revalidateLimits(): Promise<void> {
		this.countersCache.clear();
		await this.triggerLimitEvents();
	}

	private async triggerLimitEvents(): Promise<void> {
		const license = this.getLicense();
		if (!license) {
			return;
		}

		const limits = [...this._accessedLimits];
		this._accessedLimits.clear();

		for await (const limit of limits) {
			for await (const behavior of behaviorsWithLimitEvents) {
				if (this.has(`limitReached:${limit}:${behavior}`) && (await this.isLimitReached(limit, [behavior], undefined, 0, false))) {
					limitReached.call(this, limit, behavior);
				}
			}
		}
	}

	public async revalidateLicense(): Promise<void> {
		if (!this.hasValidLicense()) {
			return;
		}

		try {
			this.countersCache.clear();
			await this.validateLicense(false);
		} finally {
			this.maybeInvalidateLicense();
		}
	}

	private clearLicenseData(): void {
		this._license = undefined;
		this._unmodifiedLicense = undefined;
		this._inFairPolicy = undefined;
		this._valid = false;
		this._lockedLicense = undefined;
		this.countersCache.clear();
		clearPendingLicense.call(this);
	}

	private maybeInvalidateLicense(): void {
		if (this.hasValidLicense()) {
			return;
		}

		licenseInvalidated.call(this);
		invalidateAll.call(this);
	}

	private async setLicenseV3(newLicense: ILicenseV3, encryptedLicense: string, originalLicense?: ILicenseV2 | ILicenseV3): Promise<void> {
		const hadValidLicense = this.hasValidLicense();
		this.clearLicenseData();

		try {
			this._unmodifiedLicense = originalLicense || newLicense;
			this._license = newLicense;

			await this.validateLicense(encryptedLicense !== this._lockedLicense);
			this._lockedLicense = encryptedLicense;

			if (this.valid) {
				licenseValidated.call(this);
				showLicense.call(this, this._license, this._valid);
			}
		} finally {
			if (hadValidLicense) {
				this.maybeInvalidateLicense();
			}
		}
	}

	private async setLicenseV2(newLicense: ILicenseV2, encryptedLicense: string): Promise<void> {
		return this.setLicenseV3(convertToV3(newLicense), encryptedLicense, newLicense);
	}

	private isLicenseDuplicated(encryptedLicense: string): boolean {
		return Boolean(this._lockedLicense && this._lockedLicense === encryptedLicense);
	}

	private async validateLicenseBehaviors(behaviorsToConsider: LicenseBehavior[]): Promise<void> {
		if (!this._license) {
			throw new InvalidLicenseError();
		}

		if (!isReadyForValidation.call(this)) {
			throw new NotReadyForValidation();
		}

		// Run the `invalidate_license` behavior first and skip everything else if it's already invalid.
		const validationResult = await runValidation.call(
			this,
			this._license,
			behaviorsToConsider.filter((behavior) => invalidLicenseBehaviors.includes(behavior)),
		);

		if (isBehaviorsInResult(validationResult, invalidLicenseBehaviors)) {
			this._valid = false;
			return;
		}

		const generalResult = await runValidation.call(
			this,
			this._license,
			behaviorsToConsider.filter((behavior) => generalValidationBehaviors.includes(behavior)),
		);

		this.processValidationResult(generalResult, behaviorsToConsider.includes('prevent_installation'));
	}

	private async validateLicense(isNewLicense: boolean): Promise<void> {
		return this.validateLicenseBehaviors([
			'invalidate_license',
			'start_fair_policy',
			'disable_modules',
			...(isNewLicense ? ['prevent_installation' as LicenseBehavior] : []),
		]);
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

	private processValidationResult(result: BehaviorWithContext[], isNewLicense: boolean): void {
		if (!this._license || isBehaviorsInResult(result, invalidLicenseBehaviors)) {
			this._valid = false;
			return;
		}

		const shouldLogModules = !this._valid || isNewLicense;

		this._valid = true;
		this._inFairPolicy = isBehaviorsInResult(result, ['start_fair_policy']);

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
		context?: Partial<LimitContext<T>>,
		newCount = 1,
	): Promise<boolean> {
		return this._isLimitReached(action, ['prevent_action'], context, newCount);
	}

	protected async _isLimitReached<T extends LicenseLimitKind>(
		action: T,
		behaviorsToConsider?: LicenseBehavior[],
		context?: Partial<LimitContext<T>>,
		extraCount = 0,
		flagAsAccessed = true,
	): Promise<boolean> {
		const license = this.getLicense();
		if (!license) {
			return false;
		}

		if (action !== 'roomsPerGuest' && flagAsAccessed) {
			this._accessedLimits.add(action);
		}

		const filteredLimits = license.limits[action]?.filter(
			({ behavior, max }) => max >= 0 && (!behaviorsToConsider || behaviorsToConsider.includes(behavior)),
		);
		if (!filteredLimits?.length) {
			return false;
		}

		const currentValue = (await getCurrentValueForLicenseLimit.call(this, action, context)) + extraCount;
		return Boolean(filteredLimits.some(({ max }) => max < currentValue));
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
