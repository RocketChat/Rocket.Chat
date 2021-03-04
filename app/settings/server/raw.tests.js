/* eslint-env mocha */
import chai, { expect } from 'chai';
import spies from 'chai-spies';
import rewire from 'rewire';

chai.use(spies);

describe('Raw Settings', () => {
	let rawModule;
	const cache = new Map();

	before('rewire deps', () => {
		const spy = chai.spy(async (id) => {
			if (id === '1') { return 'some-setting-value'; }
			return null;
		});

		rawModule = rewire('./raw');
		rawModule.__set__('setFromDB', spy);
		rawModule.__set__('cache', cache);
	});

	it('should get the value from database when it isnt in cache', async () => {
		const setting = await rawModule.getValue('1');

		expect(setting).to.be.equal('some-setting-value');
	});

	it('should get the value from cache when its available', async () => {
		cache.set('2', 'supeer-setting');
		const setting = await rawModule.getValue('2');

		expect(setting).to.be.equal('supeer-setting');
	});

	it('should update the value in cache', async () => {
		await rawModule.updateValue('2', { value: 'not-super-setting' });

		expect(cache.get('2')).to.be.equal('not-super-setting');
	});

	it('should not update the setting if the new value is undefined', async () => {
		await rawModule.updateValue('2', {});

		expect(cache.get('2')).to.be.equal('not-super-setting');
	});
});
