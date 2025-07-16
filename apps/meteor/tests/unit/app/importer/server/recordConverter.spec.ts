import type { IImportRecord, IImportRecordType } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsStub = sinon.stub();
const modelsMock = {
	ImportData: {
		find: sinon.stub(),
		updateOne: sinon.stub(),
		col: {
			insertOne: sinon.stub(),
		},
	},
};

const { RecordConverter } = proxyquire.noCallThru().load('../../../../../app/importer/server/classes/converters/RecordConverter', {
	'../../../settings/server': {
		settings: { get: settingsStub },
	},
	'meteor/check': sinon.stub(),
	'meteor/meteor': sinon.stub(),
	'@rocket.chat/models': { ...modelsMock, '@global': true },
});

class TestConverter extends RecordConverter<IImportRecord> {
	constructor(workInMemory = true) {
		super({ workInMemory });
	}

	protected getDataType(): IImportRecordType {
		return 'user';
	}
}

describe('Record Converter', () => {
	const userToImport = {
		name: 'user1',
		emails: ['user1@domain.com'],
		importIds: ['importId1'],
		username: 'username1',
	};

	describe('Working with Mongo Collection', () => {
		beforeEach(() => {
			modelsMock.ImportData.col.insertOne.reset();
			modelsMock.ImportData.find.reset();
			modelsMock.ImportData.updateOne.reset();
			modelsMock.ImportData.find.callsFake(() => ({ toArray: () => [] }));
		});

		describe('Adding and Retrieving users', () => {
			it('should store objects in the collection', async () => {
				const converter = new TestConverter(false);

				await converter.addObject(userToImport);
				expect(modelsMock.ImportData.col.insertOne.getCall(0)).to.not.be.null;
			});

			it('should read objects from the collection', async () => {
				const converter = new TestConverter(false);
				await converter.addObject(userToImport);

				await converter.getDataToImport();

				expect(modelsMock.ImportData.find.getCall(0)).to.not.be.null;
			});

			it('should flag skipped records on the document', async () => {
				const converter = new TestConverter(false);
				await (converter as any).skipRecord('skippedId');

				expect(modelsMock.ImportData.updateOne.getCall(0)).to.not.be.null;
				expect(modelsMock.ImportData.updateOne.getCall(0).args).to.be.an('array').that.deep.contains({ _id: 'skippedId' });
			});

			it('should store error information on the document', async () => {
				const converter = new TestConverter(false);
				await (converter as any).saveError('errorId', new Error());

				expect(modelsMock.ImportData.updateOne.getCall(0)).to.not.be.null;
				expect(modelsMock.ImportData.updateOne.getCall(0).args).to.be.an('array').that.deep.contains({ _id: 'errorId' });
			});
		});
	});

	describe('Working in Memory', () => {
		beforeEach(() => {
			modelsMock.ImportData.col.insertOne.reset();
			modelsMock.ImportData.updateOne.reset();
			modelsMock.ImportData.find.reset();
			settingsStub.reset();
		});

		describe('Adding and Retrieving users', () => {
			it('should not store objects in the collection', async () => {
				const converter = new TestConverter(true);

				await converter.addObject(userToImport);
				expect(modelsMock.ImportData.col.insertOne.getCall(0)).to.be.null;
			});

			it('should not try to read objects from the collection', async () => {
				const converter = new TestConverter(true);
				await converter.addObject(userToImport);

				await converter.getDataToImport();

				expect(modelsMock.ImportData.find.getCall(0)).to.be.null;
			});

			it('should properly retrieve the data added to memory', async () => {
				const converter = new TestConverter(true);

				await converter.addObject(userToImport);
				const dataToImport = await converter.getDataToImport();

				expect(dataToImport.length).to.be.equal(1);
				expect(dataToImport[0].data).to.be.equal(userToImport);
			});

			it('should not access the collection when flagging skipped records', async () => {
				const converter = new TestConverter(true);
				await (converter as any).skipRecord('skippedId');

				expect(modelsMock.ImportData.updateOne.getCall(0)).to.be.null;
			});

			it('should not access the collection when storing error information', async () => {
				const converter = new TestConverter(true);
				await (converter as any).saveError('errorId', new Error());

				expect(modelsMock.ImportData.updateOne.getCall(0)).to.be.null;
			});
		});
	});
});
