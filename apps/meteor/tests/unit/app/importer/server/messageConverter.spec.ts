import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsStub = sinon.stub();
const modelsMock = {
	Rooms: {
		findOneByImportId: sinon.stub(),
	},
};
const insertMessage = sinon.stub();

const { MessageConverter } = proxyquire.noCallThru().load('../../../../../app/importer/server/classes/converters/MessageConverter', {
	'../../../settings/server': {
		settings: { get: settingsStub },
	},
	'../../../../lib/server/functions/insertMessage': {
		insertMessage,
	},
	'meteor/check': sinon.stub(),
	'meteor/meteor': sinon.stub(),
	'@rocket.chat/models': { ...modelsMock, '@global': true },
});

describe('Message Converter', () => {
	beforeEach(() => {
		modelsMock.Rooms.findOneByImportId.reset();
		insertMessage.reset();
		settingsStub.reset();
	});

	const messageToImport = {
		ts: Date.now(),
		u: {
			_id: 'rocket.cat',
		},
		rid: 'general',
		msg: 'testing',
	};

	describe('[insertMessage]', () => {
		it('function should be called by the converter', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');

			await converter.addObject(messageToImport);
			await converter.convertData();

			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertMessage.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(converter.insertMessage.getCall(0).args[0]).to.be.deep.equal(messageToImport);
		});

		it('should call insertMessage lib function to save the message', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'main');

			await (converter as any).insertMessage(messageToImport);

			expect(insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(insertMessage.getCall(0).args).to.be.an('array').with.lengthOf(4);
			expect(insertMessage.getCall(0).args[0]).to.be.deep.equal({
				_id: 'rocket.cat',
				username: 'rocket.cat',
			});
			expect(insertMessage.getCall(0).args[1]).to.deep.include({
				ts: messageToImport.ts,
				msg: messageToImport.msg,
				rid: 'main',
			});
		});
	});

	describe('[buildMessageObject]', () => {
		it('should have the basic info', async () => {
			const converter = new MessageConverter({ workInMemory: true });

			const converted = await converter.buildMessageObject(messageToImport, 'general', { _id: 'rocket.cat', username: 'rocket.cat' });

			expect(converted)
				.to.be.an('object')
				.that.deep.includes({
					ts: messageToImport.ts,
					msg: messageToImport.msg,
					u: {
						_id: 'rocket.cat',
						username: 'rocket.cat',
					},
				});
		});

		// #TODO: Validate all message attributes
	});

	describe('callbacks', () => {
		it('beforeImportFn should be triggered', async () => {
			const beforeImportFn = sinon.stub();
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');

			await converter.addObject(messageToImport);
			await converter.convertData({
				beforeImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('afterImportFn should be triggered', async () => {
			const afterImportFn = sinon.stub();
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');

			await converter.addObject(messageToImport);
			await converter.convertData({
				afterImportFn,
			});

			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('should skip record if beforeImportFn returns false', async () => {
			let recordId = null;
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake((record) => {
				recordId = record._id;
				return false;
			});

			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');
			sinon.stub(converter, 'skipRecord');

			await converter.addObject(messageToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.skipRecord.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipRecord.getCall(0).args).to.be.an('array').that.is.deep.equal([recordId]);
			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('should not skip record if beforeImportFn returns true', async () => {
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');

			sinon.stub(converter, 'insertMessage');
			sinon.stub(converter, 'resetLastMessages');
			sinon.stub(converter, 'skipRecord');

			await converter.addObject(messageToImport);
			await converter.convertData({
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipRecord.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.insertMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('onErrorFn should be triggered if mandatory attributes are missing', async () => {
			const converter = new MessageConverter({ workInMemory: true });
			converter._cache.addRoom('general', 'general');
			sinon.stub(converter, 'resetLastMessages');

			const onErrorFn = sinon.stub();

			sinon.stub(converter, 'saveError');

			await converter.addObject({});
			await converter.convertData({ onErrorFn });

			expect(onErrorFn.getCall(0)).to.not.be.null;
			expect(converter.saveError.getCall(0)).to.not.be.null;
		});
	});
});
