import { expect } from 'chai';

import { FederatedUser } from '../../../../../../../app/federation-v2/server/domain/FederatedUser';

describe('Federation - Domain - FederatedUser', () => {
	describe('#createInstance()', () => {
		it('should set the internal user name when it was provided', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: '',
				username: 'username',
				existsOnlyOnProxyServer: false,
			});
			expect(federatedUser.internalReference.username).to.be.equal('username');
		});

		it('should set the internal name when it was provided', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: 'name',
				username: '',
				existsOnlyOnProxyServer: false,
			});
			expect(federatedUser.internalReference.name).to.be.equal('name');
		});

		it('should set the existsOnlyOnProxyServer it was provided', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: '',
				username: 'username',
				existsOnlyOnProxyServer: true,
			});
			expect(federatedUser.existsOnlyOnProxyServer).to.be.true;
		});

		it('should return an instance of FederatedUser', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: '',
				username: 'username',
				existsOnlyOnProxyServer: false,
			});
			expect(federatedUser).to.be.instanceOf(FederatedUser);
		});
	});
});
