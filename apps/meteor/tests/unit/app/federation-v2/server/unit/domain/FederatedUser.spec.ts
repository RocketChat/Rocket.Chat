/* eslint-disable import/first */
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../app/federation-v2/server/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

describe('Federation - Domain - FederatedUser', () => {
	describe('#createInstance()', () => {
		it('should create the instance with the internalId as the provided one', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: '',
				username: 'username',
				existsOnlyOnProxyServer: false,
			});
			expect(federatedUser.getInternalId()).to.be.equal('hexString');
		});

		it('should create the instance with the internalId equal to the automatically generated one', () => {
			const federatedUser = FederatedUser.createWithInternalReference('@marcos:matrix.org', true, { _id: 'userId' } as any);
			expect(federatedUser.getInternalId()).to.be.equal('userId');
		});

		it('should set the internal user name when it was provided', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: '',
				username: 'username',
				existsOnlyOnProxyServer: false,
			});
			expect(federatedUser.getUsername()).to.be.equal('username');
		});

		it('should set the internal name when it was provided', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: 'name',
				username: '',
				existsOnlyOnProxyServer: false,
			});
			expect(federatedUser.getName()).to.be.equal('name');
		});

		it('should set the existsOnlyOnProxyServer it was provided', () => {
			const federatedUser = FederatedUser.createInstance('@marcos:matrix.org', {
				name: '',
				username: 'username',
				existsOnlyOnProxyServer: true,
			});
			expect(federatedUser.isRemote()).to.be.false;
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

	describe('#createWithInternalReference()', () => {
		it('should set the internal room name when it was provided', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, {} as any);
			expect(federatedUser.getInternalReference()).to.be.eql({ _id: 'hexString' });
		});

		it('should return an instance of FederatedUser', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, {} as any);
			expect(federatedUser).to.be.instanceOf(FederatedUser);
		});
	});

	describe('#getInternalReference()', () => {
		it('should return the object (that was provided) for the internal reference', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, { _id: 'userId' } as any);
			expect(federatedUser.getInternalReference()).to.be.eql({ _id: 'userId' });
		});

		it('should return a frozen object', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, { _id: 'userId' } as any);
			expect(Object.isFrozen(federatedUser.getInternalReference())).to.be.equal(true);
		});
	});

	describe('#getStorageRepresentation()', () => {
		it('should return the object shape to store', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, { _id: 'userId' } as any);
			expect(federatedUser.getStorageRepresentation()).to.have.all.keys([
				'_id',
				'username',
				'type',
				'status',
				'active',
				'roles',
				'name',
				'requirePasswordChange',
				'createdAt',
				'_updatedAt',
				'federated',
			]);
		});
	});

	describe('#getUsername()', () => {
		it('should return the user username if it exists', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, { username: 'username' } as any);
			expect(federatedUser.getUsername()).to.be.equal('username');
		});

		it('should return undefined if the username does not exists', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, {} as any);
			expect(federatedUser.getUsername()).to.be.equal(undefined);
		});
	});

	describe('#getName()', () => {
		it('should return the user name if it exists', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, { name: 'name' } as any);
			expect(federatedUser.getName()).to.be.equal('name');
		});

		it('should return undefined if the name does not exists', () => {
			const federatedUser = FederatedUser.createWithInternalReference('!externalId@id', true, {} as any);
			expect(federatedUser.getName()).to.be.equal(undefined);
		});
	});

	describe('#isOriginalFromTheProxyServer()', () => {
		it('should return true if the room is original from the proxy home server', () => {
			expect(FederatedUser.isOriginalFromTheProxyServer('proxy', 'proxy')).to.be.equal(true);
		});

		it('should return false if the room is NOT original from the proxy home server', () => {
			expect(FederatedUser.isOriginalFromTheProxyServer('externalserver', 'proxy')).to.be.equal(false);
		});
	});

	describe('#getExternalId()', () => {
		it('should return the externalId equal to the provided one', () => {
			const federatedUser = FederatedUser.createWithInternalReference('externalId', true, { name: 'name' } as any);
			expect(federatedUser.getExternalId()).to.be.equal('externalId');
		});
	});

	describe('#getInternalId()', () => {
		it('should return the internalId equal to the provided one', () => {
			const federatedUser = FederatedUser.createWithInternalReference('externalId', true, { _id: 'userId' } as any);
			expect(federatedUser.getInternalId()).to.be.equal('userId');
		});
	});

	describe('#isRemote()', () => {
		it('should return false if the user exists only on the proxy home server', () => {
			const federatedUser = FederatedUser.createWithInternalReference('externalId', true, { name: 'name' } as any);
			expect(federatedUser.isRemote()).to.be.equal(false);
		});

		it('should return true if the user exists NOT only on the proxy home server (its originally from an external home server)', () => {
			const federatedUser = FederatedUser.createWithInternalReference('externalId', false, { name: 'name' } as any);
			expect(federatedUser.isRemote()).to.be.equal(true);
		});
	});
});
