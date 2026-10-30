import type { ISetting } from '@rocket.chat/core-typings';

import { settings } from './settings';
import { PublicSettings } from '../../stores';

const createSetting = (_id: string) => ({ _id, value: true }) as ISetting;

describe('settings wildcard observers', () => {
	beforeEach(() => {
		PublicSettings.state.replaceAll([]);
	});

	it('reports the actual IDs when settings are removed', () => {
		PublicSettings.state.replaceAll([createSetting('Setting_A'), createSetting('Setting_B')]);
		const callback = jest.fn();
		const stop = settings.observe('*', callback);
		try {
			PublicSettings.state.delete('Setting_A');
			PublicSettings.state.delete('Setting_B');

			expect(callback.mock.calls).toEqual([
				['Setting_A', undefined],
				['Setting_B', undefined],
			]);
		} finally {
			stop();
		}
	});

	it('keeps keyed observers scoped to their setting', () => {
		PublicSettings.state.replaceAll([createSetting('Setting_A'), createSetting('Setting_B')]);
		const callback = jest.fn();
		const stop = settings.observe('Setting_A', callback);
		try {
			PublicSettings.state.delete('Setting_B');
			expect(callback).not.toHaveBeenCalled();
			PublicSettings.state.delete('Setting_A');
			expect(callback).toHaveBeenCalledWith('Setting_A', undefined);
		} finally {
			stop();
		}
	});

	it('stops wildcard notifications after unsubscribe', () => {
		PublicSettings.state.store(createSetting('Setting_A'));
		const callback = jest.fn();
		const stop = settings.observe('*', callback);
		stop();

		PublicSettings.state.delete('Setting_A');

		expect(callback).not.toHaveBeenCalled();
	});
});
