/* eslint-disable @typescript-eslint/camelcase */
import { expect } from 'chai';

import { validateSetting } from '../../../../../../app/settings/server/functions/validateSetting';

describe('validateSettings', () => {
	it('should validate the type string', () => {
		expect(() => validateSetting('test', 'string', 'value')).to.not.throw();
	});
	it('should throw an error expecting string receiving int', () => {
		expect(() => validateSetting('test', 'string', 10)).to.throw();
	});
	it('should validate the type int', () => {
		expect(() => validateSetting('test', 'int', 10)).to.not.throw();
	});
	it('should throw an error expecting int receiving string', () => {
		expect(() => validateSetting('test', 'int', '10')).to.throw();
	});
	it('should validate the type boolean', () => {
		expect(() => validateSetting('test', 'boolean', true)).to.not.throw();
	});
	it('should throw an error expecting boolean receiving string', () => {
		expect(() => validateSetting('test', 'boolean', 'true')).to.throw();
	});
	it('should validate the type date', () => {
		expect(() => validateSetting('test', 'date', new Date())).to.not.throw();
	});
	it('should throw an error expecting date receiving string', () => {
		expect(() => validateSetting('test', 'date', '2019-01-01')).to.throw();
	});
	it('should validate the type multiSelect', () => {
		expect(() => validateSetting('test', 'multiSelect', [])).to.not.throw();
	});
	it('should throw an error expecting multiSelect receiving string', () => {
		expect(() => validateSetting('test', 'multiSelect', '[]')).to.throw();
	});
});
