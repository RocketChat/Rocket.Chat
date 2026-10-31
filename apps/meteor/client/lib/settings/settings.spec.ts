import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

import { settings } from './settings';
import { PublicSettings } from '../../stores';

const createSetting = (_id: string, value: SettingValue) => ({ _id, value }) as ISetting;

describe('settings.observe', () => {
	beforeEach(() => {
		PublicSettings.state.replaceAll([]);
	});

	it('should call the callback when the setting is added', () => {
		const callback = jest.fn();
		const stop = settings.observe('Test_Setting', callback);

		PublicSettings.state.store(createSetting('Test_Setting', true));

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith('Test_Setting', true);
		stop();
	});

	it('should call the callback when the setting value changes', () => {
		PublicSettings.state.store(createSetting('Test_Setting', 1));

		const callback = jest.fn();
		const stop = settings.observe('Test_Setting', callback);

		PublicSettings.state.store(createSetting('Test_Setting', 2));

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith('Test_Setting', 2);
		stop();
	});

	it('should not call the callback when the setting is stored again with the same value', () => {
		PublicSettings.state.store(createSetting('Test_Setting', 'same'));

		const callback = jest.fn();
		const stop = settings.observe('Test_Setting', callback);

		PublicSettings.state.store(createSetting('Test_Setting', 'same'));

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it('should notify keyed and wildcard observers when an undefined setting is added only once', () => {
		const keyedCallback = jest.fn();
		const wildcardCallback = jest.fn();
		const stopKeyed = settings.observe('Undefined_Setting', keyedCallback);
		const stopWildcard = settings.observe('*', wildcardCallback);

		try {
			PublicSettings.state.store(createSetting('Undefined_Setting', undefined));

			expect(keyedCallback.mock.calls).toEqual([['Undefined_Setting', undefined]]);
			expect(wildcardCallback.mock.calls).toEqual([['Undefined_Setting', undefined]]);

			PublicSettings.state.store(createSetting('Undefined_Setting', undefined));

			expect(keyedCallback).toHaveBeenCalledTimes(1);
			expect(wildcardCallback).toHaveBeenCalledTimes(1);
		} finally {
			stopKeyed();
			stopWildcard();
		}
	});

	it('should not call the callback when another setting changes', () => {
		const callback = jest.fn();
		const stop = settings.observe('Test_Setting', callback);

		PublicSettings.state.store(createSetting('Other_Setting', true));

		expect(callback).not.toHaveBeenCalled();
		stop();
	});

	it('should call the callback with undefined when the setting is removed', () => {
		PublicSettings.state.store(createSetting('Test_Setting', true));

		const callback = jest.fn();
		const stop = settings.observe('Test_Setting', callback);

		PublicSettings.state.delete('Test_Setting');

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith('Test_Setting', undefined);
		stop();
	});

	it('should call the wildcard callback once for each added or changed setting', () => {
		PublicSettings.state.replaceAll([createSetting('Setting_A', 1), createSetting('Setting_B', 1)]);

		const callback = jest.fn();
		const stop = settings.observe('*', callback);

		PublicSettings.state.replaceAll([createSetting('Setting_A', 1), createSetting('Setting_B', 2), createSetting('Setting_C', 1)]);

		expect(callback.mock.calls).toEqual([
			['Setting_B', 2],
			['Setting_C', 1],
		]);
		stop();
	});

	it('should not call the callback after it stops observing', () => {
		const callback = jest.fn();
		const stop = settings.observe('Test_Setting', callback);
		stop();

		PublicSettings.state.store(createSetting('Test_Setting', true));

		expect(callback).not.toHaveBeenCalled();
	});
});

describe('PublicSettings store', () => {
	beforeEach(() => {
		PublicSettings.state.replaceAll([]);
	});

	it('should give the listener a previous state that holds the previous records', () => {
		PublicSettings.state.store(createSetting('Test_Setting', 1));

		const listener = jest.fn((state: typeof PublicSettings.state, prevState: typeof PublicSettings.state) => ({
			sameMap: state.records === prevState.records,
			previousValue: prevState.records.get('Test_Setting')?.value,
			currentValue: state.records.get('Test_Setting')?.value,
		}));
		const unsubscribe = PublicSettings.use.subscribe(listener);

		PublicSettings.state.store(createSetting('Test_Setting', 2));
		PublicSettings.state.update(
			(record) => record._id === 'Test_Setting',
			(record) => ({ ...record, value: 3 }),
		);
		PublicSettings.state.storeMany([createSetting('Test_Setting', 4)]);
		PublicSettings.state.replaceAll([createSetting('Test_Setting', 5)]);
		PublicSettings.state.delete('Test_Setting');

		unsubscribe();

		expect(listener.mock.results.map(({ value }) => value)).toEqual([
			{ sameMap: false, previousValue: 1, currentValue: 2 },
			{ sameMap: false, previousValue: 2, currentValue: 3 },
			{ sameMap: false, previousValue: 3, currentValue: 4 },
			{ sameMap: false, previousValue: 4, currentValue: 5 },
			{ sameMap: false, previousValue: 5, currentValue: undefined },
		]);
	});
});
