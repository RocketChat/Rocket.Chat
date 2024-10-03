import type { BehaviorWithContext, LicenseBehavior } from '@rocket.chat/core-typings';

const filterValidationResult = (result: BehaviorWithContext[], expectedBehavior: LicenseBehavior) =>
	result.filter(({ behavior }) => behavior === expectedBehavior) as BehaviorWithContext[];

export const getModulesToDisable = (validationResult: BehaviorWithContext[]): string[] => {
	return [
		...new Set([
			...filterValidationResult(validationResult, 'disable_modules')
				.map(({ modules }) => modules || [])
				.flat(),
		]),
	];
};
