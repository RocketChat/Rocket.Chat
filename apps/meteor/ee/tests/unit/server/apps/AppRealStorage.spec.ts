import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { AppInstallationSource, type IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { expect } from 'chai';
import sinon from 'sinon';

import { AppRealStorage } from '../../../../server/apps/storage/AppRealStorage';

describe('AppRealStorage', () => {
	let storage: AppRealStorage;
	let mockDb: any;
	let mockAppStorageItem: IAppStorageItem;

	beforeEach(() => {
		mockDb = {
			findOne: sinon.stub(),
			find: sinon.stub(),
			insertOne: sinon.stub(),
			findOneAndUpdate: sinon.stub(),
			deleteOne: sinon.stub(),
		};

		storage = new AppRealStorage(mockDb);

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

	describe('update', () => {
		it('should update an app', async () => {
			mockDb.findOneAndUpdate.resolves(mockAppStorageItem);

			const result = await storage.update(mockAppStorageItem);

			expect(result).to.deep.equal(mockAppStorageItem);
			expect(
				mockDb.findOneAndUpdate.calledWith(
					{ id: mockAppStorageItem.id, _id: mockAppStorageItem._id },
					{ $set: mockAppStorageItem },
					{ returnDocument: 'after' },
				),
			).to.be.true;
		});

		it('should unset permissionsGranted if not present', async () => {
			delete mockAppStorageItem.permissionsGranted;

			mockDb.findOneAndUpdate.resolves(mockAppStorageItem);

			await storage.update(mockAppStorageItem);

			expect(
				mockDb.findOneAndUpdate.calledWith(
					{ id: mockAppStorageItem.id, _id: mockAppStorageItem._id },
					{
						$set: mockAppStorageItem,
						$unset: { permissionsGranted: 1 },
					},
					{ returnDocument: 'after' },
				),
			).to.be.true;
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
});
