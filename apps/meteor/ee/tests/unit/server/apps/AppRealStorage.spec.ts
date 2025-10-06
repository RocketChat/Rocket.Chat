import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { AppInstallationSource, type IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { expect } from 'chai';
import sinon from 'sinon';

import { AppRealStorage } from '../../../../server/apps/storage/AppRealStorage';

describe('AppRealStorage', () => {
	let storage: AppRealStorage;
	let mockAppStorageItem: IAppStorageItem;

	let mockDb: {
		findOne: sinon.SinonStub;
		find: sinon.SinonStub;
		insertOne: sinon.SinonStub;
		findOneAndUpdate: sinon.SinonStub;
		deleteOne: sinon.SinonStub;
		updateOne: sinon.SinonStub;
	};

	beforeEach(() => {
		mockDb = {
			findOne: sinon.stub(),
			find: sinon.stub(),
			insertOne: sinon.stub(),
			findOneAndUpdate: sinon.stub(),
			deleteOne: sinon.stub(),
			updateOne: sinon.stub(),
		};

		storage = new AppRealStorage(mockDb as any);

		mockAppStorageItem = {
			id: 'test-app',
			status: AppStatus.INITIALIZED,
			installationSource: AppInstallationSource.PRIVATE,
			languageContent: {},
			settings: {},
			implemented: {},
			permissionsGranted: [],
			info: {
				nameSlug: 'test-app',
				name: 'Test App',
				description: 'Test Description',
				version: '1.0.0',
				id: 'test-app',
				requiredApiVersion: '1.0.0',
				author: {
					name: 'Test Author',
					homepage: 'https://test-author.com',
					support: 'https://test-author.com/support',
				},
				classFile: 'test-app.js',
				implements: [AppInterface.IPostExternalComponentClosed],
				iconFile: 'test-icon.png',
			},
		};
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('create', () => {
		it('should create a new app storage item', async () => {
			mockDb.findOne.resolves(null);
			mockDb.insertOne.resolves({ insertedId: 'new-id' });

			const result = await storage.create(mockAppStorageItem);

			expect(result).to.deep.include(mockAppStorageItem);
			expect(result._id).to.equal('new-id');
			expect(result.createdAt).to.be.instanceOf(Date);
			expect(result.updatedAt).to.be.instanceOf(Date);
		});

		it('should throw error if app already exists', async () => {
			mockDb.findOne.resolves({ id: 'test-app' });

			await expect(storage.create(mockAppStorageItem)).to.be.rejectedWith('App already exists.');
		});
	});

	describe('retrieveOne', () => {
		it('should retrieve an app by id', async () => {
			mockDb.findOne.resolves(mockAppStorageItem);

			const result = await storage.retrieveOne('test-app');

			expect(result).to.deep.equal(mockAppStorageItem);
			expect(mockDb.findOne.calledWith({ $or: [{ _id: 'test-app' }, { id: 'test-app' }] })).to.be.true;
		});
	});

	describe('retrieveAll', () => {
		it('should retrieve all apps', async () => {
			const mockApps = [
				{ id: 'app1', _id: 'id1' },
				{ id: 'app2', _id: 'id2' },
			];

			mockDb.find.returns({
				toArray: sinon.stub().resolves(mockApps),
			});

			const result = await storage.retrieveAll();

			expect(result.size).to.equal(2);
			expect(result.get('app1')).to.deep.equal(mockApps[0]);
			expect(result.get('app2')).to.deep.equal(mockApps[1]);
		});
	});

	describe('retrieveAllPrivate', () => {
		it('should retrieve all private apps', async () => {
			const mockApps = [
				{ id: 'private-app1', _id: 'id1', installationSource: 'private' },
				{ id: 'private-app2', _id: 'id2', installationSource: 'private' },
			];

			mockDb.find.returns({
				toArray: sinon.stub().resolves(mockApps),
			});

			const result = await storage.retrieveAllPrivate();

			expect(result.size).to.equal(2);
			expect(result.get('private-app1')).to.deep.equal(mockApps[0]);
			expect(result.get('private-app2')).to.deep.equal(mockApps[1]);
			expect(mockDb.find.calledWith({ installationSource: 'private' })).to.be.true;
		});
	});

	describe('remove', () => {
		it('should remove an app', async () => {
			mockDb.deleteOne.resolves({ deletedCount: 1 });

			const result = await storage.remove('test-app');

			expect(result).to.deep.equal({ success: true });
			expect(mockDb.deleteOne.calledWith({ id: 'test-app' })).to.be.true;
		});
	});

	describe('updatePartialAndReturnDocument', () => {
		it('should throw error when _id is missing', async () => {
			const itemWithoutId = { ...mockAppStorageItem };

			await expect(storage.updatePartialAndReturnDocument(itemWithoutId as any)).to.be.rejectedWith(
				'Property _id is required to update an app storage item',
			);
		});

		it('should throw error when _id is null', async () => {
			const itemWithNullId = { ...mockAppStorageItem, _id: null };

			await expect(storage.updatePartialAndReturnDocument(itemWithNullId as any)).to.be.rejectedWith(
				'Property _id is required to update an app storage item',
			);
		});

		it('should throw error when _id is undefined', async () => {
			const itemWithUndefinedId = { ...mockAppStorageItem, _id: undefined };

			await expect(storage.updatePartialAndReturnDocument(itemWithUndefinedId as any)).to.be.rejectedWith(
				'Property _id is required to update an app storage item',
			);
		});

		it('should throw error when _id is empty string', async () => {
			const itemWithEmptyId = { ...mockAppStorageItem, _id: '' };

			await expect(storage.updatePartialAndReturnDocument(itemWithEmptyId as any)).to.be.rejectedWith(
				'Property _id is required to update an app storage item',
			);
		});

		it('should unset permissionsGranted when unsetPermissionsGranted is true', async () => {
			const updatedItem = { ...mockAppStorageItem, _id: 'test-id' };
			const expectedItem = { ...mockAppStorageItem };
			delete expectedItem.permissionsGranted;
			mockDb.findOneAndUpdate.resolves(expectedItem);

			const result = await storage.updatePartialAndReturnDocument(updatedItem, { unsetPermissionsGranted: true });

			expect(result).to.deep.equal(expectedItem);
			expect(
				mockDb.findOneAndUpdate.calledWith(
					{ _id: 'test-id' },
					{
						$set: expectedItem,
						$unset: { permissionsGranted: 1 },
					},
					{ returnDocument: 'after' },
				),
			).to.be.true;
		});

		it('should not unset permissionsGranted when unsetPermissionsGranted is false', async () => {
			const updatedItem = { ...mockAppStorageItem, _id: 'test-id' };
			mockDb.findOneAndUpdate.resolves(updatedItem);

			await storage.updatePartialAndReturnDocument(updatedItem, { unsetPermissionsGranted: false });

			expect(mockDb.findOneAndUpdate.calledWith({ _id: 'test-id' }, { $set: mockAppStorageItem }, { returnDocument: 'after' })).to.be.true;
		});

		it('should not unset permissionsGranted when no options are passed', async () => {
			const updatedItem = { ...mockAppStorageItem, _id: 'test-id' };
			mockDb.findOneAndUpdate.resolves(updatedItem);

			await storage.updatePartialAndReturnDocument(updatedItem);

			expect(mockDb.findOneAndUpdate.calledWith({ _id: 'test-id' }, { $set: mockAppStorageItem }, { returnDocument: 'after' })).to.be.true;
		});
	});

	describe('updateStatus', () => {
		it('should update app status and return true when modified', async () => {
			mockDb.updateOne.resolves({ modifiedCount: 1 });

			const result = await storage.updateStatus('test-id', AppStatus.AUTO_ENABLED);

			expect(result).to.be.true;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { status: AppStatus.AUTO_ENABLED } })).to.be.true;
		});

		it('should return false when no document was modified', async () => {
			mockDb.updateOne.resolves({ modifiedCount: 0 });

			const result = await storage.updateStatus('test-id', AppStatus.DISABLED);

			expect(result).to.be.false;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { status: AppStatus.DISABLED } })).to.be.true;
		});
	});

	describe('updateSetting', () => {
		it('should update app setting and return true when modified', async () => {
			const mockSetting = {
				id: 'test-setting',
				type: SettingType.STRING,
				packageValue: 'default-value',
				value: 'updated-value',
				required: false,
				public: true,
				i18nLabel: 'Test Setting',
			};
			mockDb.updateOne.resolves({ modifiedCount: 1 });

			const result = await storage.updateSetting('test-id', mockSetting);

			expect(result).to.be.true;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { 'settings.test-setting': mockSetting } })).to.be.true;
		});

		it('should return false when no document was modified', async () => {
			const mockSetting = {
				id: 'test-setting',
				type: SettingType.STRING,
				packageValue: 'default-value',
				value: 'updated-value',
				required: false,
				public: true,
				i18nLabel: 'Test Setting',
			};
			mockDb.updateOne.resolves({ modifiedCount: 0 });

			const result = await storage.updateSetting('test-id', mockSetting);

			expect(result).to.be.false;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { 'settings.test-setting': mockSetting } })).to.be.true;
		});
	});

	describe('updateAppInfo', () => {
		it('should update app info and return true when modified', async () => {
			const mockAppInfo = {
				id: 'test-app',
				name: 'Updated Test App',
				nameSlug: 'updated-test-app',
				description: 'Updated Description',
				version: '2.0.0',
				requiredApiVersion: '2.0.0',
				author: {
					name: 'Updated Author',
					homepage: 'https://updated-author.com',
					support: 'https://updated-author.com/support',
				},
				classFile: 'updated-app.js',
				implements: [],
				iconFile: 'updated-icon.png',
			};
			mockDb.updateOne.resolves({ modifiedCount: 1 });

			const result = await storage.updateAppInfo('test-id', mockAppInfo);

			expect(result).to.be.true;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { info: mockAppInfo } })).to.be.true;
		});

		it('should return false when no document was modified', async () => {
			const mockAppInfo = {
				id: 'test-app',
				name: 'Updated Test App',
				nameSlug: 'updated-test-app',
				description: 'Updated Description',
				version: '2.0.0',
				requiredApiVersion: '2.0.0',
				author: {
					name: 'Updated Author',
					homepage: 'https://updated-author.com',
					support: 'https://updated-author.com/support',
				},
				classFile: 'updated-app.js',
				implements: [],
				iconFile: 'updated-icon.png',
			};
			mockDb.updateOne.resolves({ modifiedCount: 0 });

			const result = await storage.updateAppInfo('test-id', mockAppInfo);

			expect(result).to.be.false;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { info: mockAppInfo } })).to.be.true;
		});
	});

	describe('updateMarketplaceInfo', () => {
		it('should update marketplace info and return true when modified', async () => {
			const mockMarketplaceInfo = [
				{
					id: 'test-app',
					name: 'Test App',
					nameSlug: 'test-app',
					version: '2.0.0',
					description: 'Test Description',
					requiredApiVersion: '2.0.0',
					author: {
						name: 'Test Author',
						homepage: 'https://test-author.com',
						support: 'https://test-author.com/support',
					},
					classFile: 'test-app.js',
					implements: [],
					iconFile: 'test-icon.png',
					categories: ['productivity'],
					status: 'published',
					isVisible: true,
					isPurchased: false,
					isSubscribed: false,
					isBundled: false,
					createdDate: '2023-01-01T00:00:00.000Z',
					modifiedDate: '2023-01-01T00:00:00.000Z',
					price: 0,
					purchaseType: 'free' as any,
				},
			];
			mockDb.updateOne.resolves({ modifiedCount: 1 });

			const result = await storage.updateMarketplaceInfo('test-id', mockMarketplaceInfo);

			expect(result).to.be.true;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { marketplaceInfo: mockMarketplaceInfo } })).to.be.true;
		});

		it('should return false when no document was modified', async () => {
			const mockMarketplaceInfo = [
				{
					id: 'test-app',
					name: 'Test App',
					nameSlug: 'test-app',
					version: '2.0.0',
					description: 'Test Description',
					requiredApiVersion: '2.0.0',
					author: {
						name: 'Test Author',
						homepage: 'https://test-author.com',
						support: 'https://test-author.com/support',
					},
					classFile: 'test-app.js',
					implements: [],
					iconFile: 'test-icon.png',
					categories: ['productivity'],
					status: 'published',
					isVisible: true,
					isPurchased: false,
					isSubscribed: false,
					isBundled: false,
					createdDate: '2023-01-01T00:00:00.000Z',
					modifiedDate: '2023-01-01T00:00:00.000Z',
					price: 0,
					purchaseType: 'free' as any,
				},
			];
			mockDb.updateOne.resolves({ modifiedCount: 0 });

			const result = await storage.updateMarketplaceInfo('test-id', mockMarketplaceInfo);

			expect(result).to.be.false;
			expect(mockDb.updateOne.calledWith({ _id: 'test-id' }, { $set: { marketplaceInfo: mockMarketplaceInfo } })).to.be.true;
		});
	});
});
