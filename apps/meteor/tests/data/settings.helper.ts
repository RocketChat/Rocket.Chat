import type { ISetting } from '@rocket.chat/core-typings';
import { before, after } from 'mocha';

import { getSettingValueById, updateSetting } from './permissions.helper';

/**
 * Creates `before`/`after` hooks that capture the current value of a setting,
 * apply a new value, and restore the original after the block finishes.
 *
 * Must be called inside a `describe()` block so that Mocha registers the hooks
 * in the correct suite.
 *
 * @example
 * describe('my suite', () => {
 *   withSetting('Push_enable', false);
 *
 *   it('runs with push disabled', () => { ... });
 * });
 */
export function withSetting(settingName: string, value: ISetting['value']): void {
	let originalValue: ISetting['value'];

	before(async () => {
		originalValue = await getSettingValueById(settingName);
		await updateSetting(settingName, value);
	});

	after(async () => {
		await updateSetting(settingName, originalValue);
	});
}

/**
 * Registers `before`/`after` hooks that capture the current values of
 * multiple settings and restore them when the block finishes.
 *
 * This is useful when a suite changes several settings and you want to
 * guarantee they all return to their original state regardless of which
 * tests modified them.
 *
 * @example
 * describe('my suite', () => {
 *   preserveSettingValues(['Discussion_enabled', 'Threads_enabled']);
 *
 *   it('changes settings freely', async () => {
 *     await updateSetting('Discussion_enabled', false);
 *     // ...
 *   });
 * });
 */
export function preserveSettingValues(settingNames: string[]): void {
	const originalValues: Record<string, ISetting['value']> = {};

	before(async () => {
		const values = await Promise.all(settingNames.map((name) => getSettingValueById(name)));
		settingNames.forEach((name, i) => {
			originalValues[name] = values[i];
		});
	});

	after(async () => {
		await Promise.all(Object.entries(originalValues).map(([name, value]) => updateSetting(name, value)));
	});
}
