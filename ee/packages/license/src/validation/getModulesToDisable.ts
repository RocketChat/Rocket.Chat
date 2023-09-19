import type { BehaviorWithContext, LicenseBehavior } from '../definition/LicenseBehavior';
import type { LicenseModule } from '../definition/LicenseModule';

const filterValidationResult = (result: BehaviorWithContext[], expectedBehavior: LicenseBehavior) =>
	result.filter(({ behavior }) => behavior === expectedBehavior) as BehaviorWithContext[];

export const getModulesToDisable = (validationResult: BehaviorWithContext[]): LicenseModule[] => {
	return [
		...new Set([
			...filterValidationResult(validationResult, 'disable_modules')
				.map(({ modules }) => modules || [])
				.flat(),
		]),
	];
};
