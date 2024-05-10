import { expect } from 'chai';

import { getSettingDefaults } from '../../../../../../app/settings/server/functions/getSettingDefaults';

describe('getSettingDefaults', () => {
	it('should return based on _id type value', () => {
		const setting = getSettingDefaults({ _id: 'test', value: 'test', type: 'string' });

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('i18nDescription').to.be.equal('test_Description');

		expect(setting).to.have.property('value').to.be.equal('test');
		expect(setting).to.have.property('packageValue').to.be.equal('test');

		expect(setting).to.have.property('type').to.be.equal('string');

		expect(setting).to.have.property('blocked').to.be.equal(false);

		expect(setting).to.not.have.property('multiline');
		expect(setting).to.not.have.property('values');

		expect(setting).to.not.have.property('group');
		expect(setting).to.not.have.property('section');
		expect(setting).to.not.have.property('tab');
	});

	it('should return a sorter value', () => {
		const setting = getSettingDefaults({ _id: 'test', value: 'test', type: 'string', sorter: 1 });

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('sorter').to.be.equal(1);
	});

	it('should return a private setting', () => {
		const setting = getSettingDefaults({
			_id: 'test',
			value: 'test',
			type: 'string',
			public: false,
		});

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('public').to.be.equal(false);
	});

	it('should return a public setting', () => {
		const setting = getSettingDefaults({
			_id: 'test',
			value: 'test',
			type: 'string',
			public: true,
		});

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('public').to.be.equal(true);
	});

	it('should return a blocked setting', () => {
		const setting = getSettingDefaults({
			_id: 'test',
			value: 'test',
			type: 'string',
			blocked: true,
		});

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('blocked').to.be.equal(true);
	});

	it('should return a blocked setting set by env', () => {
		const setting = getSettingDefaults({ _id: 'test', value: 'test', type: 'string' }, new Set(['test']));

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('blocked').to.be.equal(true);
	});

	it('should return a package value', () => {
		const setting = getSettingDefaults({ _id: 'test', value: true, type: 'string' }, new Set(['test']));

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.have.property('blocked').to.be.equal(true);
	});

	it('should not return undefined options', () => {
		const setting = getSettingDefaults(
			{ _id: 'test', value: true, type: 'string', section: undefined, group: undefined },
			new Set(['test']),
		);

		expect(setting).to.be.an('object');
		expect(setting).to.have.property('_id');

		expect(setting).to.not.have.property('section');
		expect(setting).to.not.have.property('group');
	});
});
