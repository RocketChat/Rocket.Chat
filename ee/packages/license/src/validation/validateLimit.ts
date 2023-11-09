import type { LicenseBehavior } from '../definition/LicenseBehavior';

/**
 * Validates if the current value is over the limit
 * @param max The maximum value allowed
 * @param currentValue The current value
 * @param behavior The behavior to be applied if the limit is reached
 * @param extraCount The extra count to be added to the current value
 * @returns
 * - true if the limit is reached
 * - false if the limit is not reached
 */
export function validateLimit(max: number, currentValue: number, behavior: LicenseBehavior, extraCount = 0) {
	switch (behavior) {
		case 'invalidate_license':
		case 'prevent_installation':
		case 'disable_modules':
		case 'start_fair_policy':
		default:
			return currentValue > max;
		case 'prevent_action':
			/**
			 * if we are validating the current count the limit should be equal or over the max, if we are validating the future count the limit should be over the max
			 */

			return extraCount ? currentValue > max : currentValue >= max;
	}
}
