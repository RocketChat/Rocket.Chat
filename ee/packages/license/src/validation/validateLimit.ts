import type { LicenseBehavior } from '@rocket.chat/core-typings';

/**
 * The difference between validateLimit and validateWarnLimit is that the first one
 * is used to trigger the client so for start_fair_policy we trigger as soon the limit is reached
 * for the visual warning we trigger when the limit is reached + 1

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
		default:
			return currentValue > max;
		case 'start_fair_policy':
			return currentValue >= max;
		case 'prevent_action':
			/**
			 * if we are validating the current count the limit should be equal or over the max, if we are validating the future count the limit should be over the max
			 */

			return extraCount ? currentValue > max : currentValue >= max;
	}
}

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

export function validateWarnLimit(max: number, currentValue: number, behavior: LicenseBehavior, extraCount = 0) {
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
