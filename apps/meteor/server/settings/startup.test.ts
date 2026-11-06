import { describe, it } from 'node:test';

import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';
import { expect, spy } from 'chai';

import { CachedSettings } from './CachedSettings';
import { reloadSettings } from './startup';

const record = (_id: string, value: ISetting['value']) => ({ _id, value }) as ISetting;

const modelWith = (records: ISetting[]) =>
	({
		find: () => ({
			forEach: async (cb: (record: ISetting) => void) => records.forEach(cb),
		}),
	}) as unknown as typeof Settings;

const cacheWith = (records: ISetting[]) => {
	const settings = new CachedSettings();
	records.forEach((r) => settings.set(r));
	settings.initialized();
	return settings;
};

describe('reloadSettings', () => {
	it('takes values written to the database after the cache was loaded', async () => {
		const settings = cacheWith([record('order', ['Favorites', 'Drafts', 'Channels'])]);
		const changed = spy();
		settings.on('order', changed);

		await reloadSettings({ model: modelWith([record('order', ['Favorites', 'Channels'])]), settings });

		expect(settings.get('order')).to.deep.equal(['Favorites', 'Channels']);
		expect(changed).to.have.been.called.exactly(1);
	});

	it('takes settings the cache did not have', async () => {
		const settings = cacheWith([]);

		await reloadSettings({ model: modelWith([record('added', true)]), settings });

		expect(settings.get('added')).to.equal(true);
	});

	it('takes value-less records the cache did not have', async () => {
		const settings = cacheWith([]);

		await reloadSettings({ model: modelWith([record('Accounts', undefined)]), settings });

		expect(settings.has('Accounts')).to.equal(true);
	});

	it('drops settings the database no longer has', async () => {
		const settings = cacheWith([record('removed', true)]);
		const changed = spy();
		settings.on('removed', changed);

		await reloadSettings({ model: modelWith([]), settings });

		expect(settings.has('removed')).to.equal(false);
		expect(changed).to.have.been.called.exactly(1);
		expect(changed).to.have.been.called.with(undefined);
	});

	it('does not emit for settings already dropped', async () => {
		const settings = cacheWith([record('gone', undefined)]);
		const changed = spy();
		settings.on('*', changed);

		await reloadSettings({ model: modelWith([]), settings });

		expect(settings.has('gone')).to.equal(false);
		expect(changed).to.not.have.been.called();
	});

	it('keeps settings cached while the database was being read', async () => {
		const settings = cacheWith([]);
		const model = {
			find: () => ({
				forEach: async () => settings.set(record('late', 1)),
			}),
		} as unknown as typeof Settings;

		await reloadSettings({ model, settings });

		expect(settings.get('late')).to.equal(1);
	});

	it('does not emit for values that did not change', async () => {
		const settings = cacheWith([record('order', ['Favorites', 'Channels']), record('flag', true)]);
		const changed = spy();
		settings.on('*', changed);

		await reloadSettings({ model: modelWith([record('order', ['Favorites', 'Channels']), record('flag', true)]), settings });

		expect(changed).to.not.have.been.called();
	});
});
