import { expect } from 'chai';

import { getMostImportantRole } from '../../../../lib/roles/getMostImportantRole';

describe('getMostImportantRole', () => {
	it('should return the same role if only one exists', () => {
		expect(getMostImportantRole(['admin'])).to.be.eq('admin');
		expect(getMostImportantRole(['livechat-manager'])).to.be.eq('livechat-manager');
		expect(getMostImportantRole(['livechat-monitor'])).to.be.eq('livechat-monitor');
		expect(getMostImportantRole(['livechat-agent'])).to.be.eq('livechat-agent');
		expect(getMostImportantRole(['user'])).to.be.eq('user');
		expect(getMostImportantRole(['guest'])).to.be.eq('guest');
		expect(getMostImportantRole(['anonymous'])).to.be.eq('anonymous');
		expect(getMostImportantRole(['app'])).to.be.eq('app');
		expect(getMostImportantRole(['bot'])).to.be.eq('bot');
	});

	it('should return custom roles as `custom-role`', () => {
		expect(getMostImportantRole(['custom1'])).to.be.eq('custom-role');
	});

	it('should return auditor, app and bot as `user`', () => {
		expect(getMostImportantRole(['auditor'])).to.be.eq('user');
		expect(getMostImportantRole(['auditor-log'])).to.be.eq('user');
	});

	it('should return `no-role` if no one exists', () => {
		expect(getMostImportantRole([])).to.be.eq('no-role');
		expect(getMostImportantRole()).to.be.eq('no-role');
	});

	it('should return correct role', () => {
		expect(getMostImportantRole(['user', 'admin'])).to.be.eq('admin');
		expect(getMostImportantRole(['user', 'anonymous'])).to.be.eq('user');
		expect(getMostImportantRole(['user', 'guest'])).to.be.eq('user');
		expect(getMostImportantRole(['user', 'guest', 'livechat-monitor'])).to.be.eq('livechat-monitor');
		expect(getMostImportantRole(['user', 'custom1'])).to.be.eq('custom-role');
		expect(getMostImportantRole(['custom2', 'user', 'custom1'])).to.be.eq('custom-role');
		expect(getMostImportantRole(['custom2', 'admin', 'custom1'])).to.be.eq('admin');
		expect(getMostImportantRole(['custom2', 'app'])).to.be.eq('custom-role');
		expect(getMostImportantRole(['anonymous', 'app'])).to.be.eq('app');
	});
});
